import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';


enum TYPE_OF_MENU {
  DELETE = 'delete',
  LINE_TEXT = 'line-text',
  SHOW_HIDE = 'show-hide',
}


@Component({
  selector: 'cds-panel-connector-menu',
  templateUrl: './cds-panel-connector-menu.component.html',
  styleUrls: ['./cds-panel-connector-menu.component.scss']
})


export class CdsPanelConnectorMenuComponent implements OnInit {

  @Input() connector: any;
  @Output() addActionFromConnectorMenu = new EventEmitter();

  typeOfmenu = TYPE_OF_MENU; 
  showLineTextarea: boolean = false;
  displayConnector: boolean = true;

  constructor() { }

  ngOnInit(): void {
    // // console.log('[CDS-ADD-CONNECTOR MENU] ', this.connector);
  }

  onAddActionFromConnectorMenu(type){
    if(type === this.typeOfmenu.SHOW_HIDE){
      this.displayConnector = false;
      this.connector['display'] = this.displayConnector;
    }
    let event = { 
      'type': type,
      'connector': this.connector
    }
    // // console.log('[CDS-ADD-CONNECTOR MENU] onAddActionFromConnectorMenu - connector: ', type, this.connector);
    this.addActionFromConnectorMenu.emit(event);
  }

  onShowLineTextArea(){
    this.showLineTextarea = true;
  }
  
  onBlur(ev){
    const testoTextArea = ev.target.value;
    // // console.log('[CDS-ADD-CONNECTOR MENU]  onBlur:: ', testoTextArea);
    this.connector['label'] = testoTextArea;
    this.connector['display'] = true;
    let event = { 
      'type': TYPE_OF_MENU.LINE_TEXT, 
      'connector': this.connector
    }
    this.showLineTextarea = false;
    this.addActionFromConnectorMenu.emit(event);
  }

}
