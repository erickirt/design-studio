import { Component, OnInit, OnDestroy, OnChanges, SimpleChanges, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';

import { Message, Wait, Expression } from 'src/app/models/action-model';
import { TEXT_CHARS_LIMIT } from '../../../../../../../utils';
import { LoggerService } from 'src/chat21-core/providers/abstract/logger.service';
import { LoggerInstance } from 'src/chat21-core/providers/logger/loggerInstance';

@Component({
  selector: 'cds-action-reply-url-preview',
  templateUrl: './cds-action-reply-url-preview.component.html',
  styleUrls: ['./cds-action-reply-url-preview.component.scss']
})
export class CdsActionReplyUrlPreviewComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild('autosize') autosize: CdkTextareaAutosize;

  @Output() updateAndSaveAction = new EventEmitter();
  @Output() changeActionReply = new EventEmitter();
  @Output() deleteActionReply = new EventEmitter();
  @Output() moveUpResponse = new EventEmitter();
  @Output() moveDownResponse = new EventEmitter();

  @Input() idAction: string;
  @Input() response: Message;
  @Input() wait: Wait;
  @Input() index: number;
  @Input() limitCharsText: number = TEXT_CHARS_LIMIT;
  @Input() previewMode: boolean = true;

  delayTime: number = 0;
  canShowFilter: boolean = true;
  filterConditionExist: boolean = false;
  booleanOperators = [{ type: 'AND', operator: 'AND' }, { type: 'OR', operator: 'OR' }];
  activeFocus: boolean = true;

  activeTab: 'text' | 'form' | 'json_sources' = 'text';

  // Text mode — saved as-is, no URL extraction
  rawText: string = '';

  // Form mode
  urlFormItems: Array<{ source_name: string; source_file_name: string; source_description: string; source_image: string }> = [
    { source_name: '', source_file_name: '', source_description: '', source_image: '' }
  ];

  // JSON Sources mode
  jsonSourcesValue: string = '';

  private readonly logger: LoggerService = LoggerInstance.getInstance();

  constructor() {}

  ngOnInit(): void {
    this.initialize();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['response'] && !changes['response'].firstChange) {
      this.detectAndRestore();
    }
  }

  ngOnDestroy(): void {
    if (this.activeTab === 'form') {
      this.saveAll();
      this.changeActionReply.emit();
    }
  }

  private initialize() {
    if (this.index == 1 && (this.wait?.time == 500 || this.wait?.time == 0)) {
      this.delayTime = 0;
    } else if (this.wait?.time && this.wait.time > 0) {
      this.delayTime = this.wait.time / 1000;
    } else {
      this.delayTime = 500 / 1000;
    }
    if (this.response?._tdJSONCondition && this.response._tdJSONCondition.conditions.length > 0) {
      this.filterConditionExist = true;
    }
    this.detectAndRestore();
  }

  private detectAndRestore(): void {
    const r = this.response as any;
    if (r?.type === 'url_preview') {
      this.activeTab = r.activeMode || 'text';
      this.rawText = typeof r.list === 'string' ? r.list : '';
      this.jsonSourcesValue = typeof r.text === 'string' ? r.text : '';
      if (Array.isArray(r.form?.sources) && r.form.sources.length > 0) {
        this.urlFormItems = r.form.sources.map(i => ({
          source_name: i.source_name || '',
          source_file_name: i.source_file_name || '',
          source_description: i.source_description || '',
          source_image: i.source_image || ''
        }));
      }
      return;
    }
    this.activeTab = 'text';
    this.rawText = '';
  }

  private saveAll(): void {
    const r = this.response as any;
    r.activeMode = this.activeTab;
    r.text = this.jsonSourcesValue;
    r.list = this.rawText;
    r.form = { sources: this.urlFormItems };
  }

  get previewText(): string {
    const r = this.response as any;
    if (r?.type !== 'url_preview') { return r?.text || ''; }
    const mode = r.activeMode || 'text';
    if (mode === 'text') {
      return typeof r.list === 'string' ? r.list : '';
    }
    if (mode === 'form') {
      return Array.isArray(r.form?.sources)
        ? r.form.sources.map(i => i.source_name).filter(u => !!u).join('\n')
        : '';
    }
    if (mode === 'json_sources') {
      return typeof r.text === 'string' ? r.text : '';
    }
    return '';
  }

  get previewActiveMode(): string {
    return (this.response as any)?.activeMode || this.activeTab;
  }

  setTab(tab: 'text' | 'form' | 'json_sources'): void {
    if (tab === this.activeTab) { return; }
    this.activeTab = tab;
    this.saveAll();
    this.changeActionReply.emit();
  }

  onFormFocusOut(event: FocusEvent): void {
    const related = event.relatedTarget as HTMLElement;
    const container = event.currentTarget as HTMLElement;
    if (!container.contains(related)) {
      this.saveAll();
      this.changeActionReply.emit();
    }
  }

  addFormItem(): void {
    this.urlFormItems.push({ source_name: '', source_file_name: '', source_description: '', source_image: '' });
  }

  removeFormItem(index: number): void {
    if (this.urlFormItems.length > 1) {
      this.urlFormItems.splice(index, 1);
    }
  }

  onJsonSourcesChange(value: string): void {
    let jsonValue = '';
    if (value) {
      // strip existing {{ }} and | json if present, then rewrap
      const inner = value.replace(/^\{\{|\}\}$/g, '').replace(/\s*\|\s*json\s*$/, '').trim();
      jsonValue = `{{${inner} | json}}`;
    }
    this.jsonSourcesValue = jsonValue;
    this.saveAll();
    this.changeActionReply.emit();
  }

  onClickDelayTime(opened: boolean) {
    this.canShowFilter = !opened;
  }

  onChangeDelayTime(value: number) {
    this.delayTime = value;
    this.wait.time = value * 1000;
    this.canShowFilter = true;
    this.changeActionReply.emit();
  }

  onChangeExpression(expression: Expression) {
    this.response._tdJSONCondition = expression;
    this.filterConditionExist = !!(expression && expression?.conditions.length > 0);
    this.changeActionReply.emit();
  }

  onDeleteActionReply() {
    this.deleteActionReply.emit(this.index);
  }

  onMoveUpResponse() {
    this.moveUpResponse.emit(this.index);
  }

  onMoveDownResponse() {
    this.moveDownResponse.emit(this.index);
  }

  onChangeTextarea(text: string) {
    if (!this.previewMode) {
      this.rawText = text;
    }
  }

  onBlur(event) {
    this.logger.log('[ACTION REPLY URL_PREVIEW] onBlur', event.target.value);
    if (this.activeTab === 'text') {
      this.saveAll();
    }
    this.changeActionReply.emit();
  }

  onSelectedAttribute(variableSelected: { name: string; value: string }) {}
}
