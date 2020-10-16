import { Component, Input, Output, EventEmitter, ViewChild, OnChanges, SimpleChanges, ElementRef, AfterViewInit } from '@angular/core';
import * as JSONEditor from 'jsoneditor';

@Component({
  selector: 'app-json-editor',
  templateUrl: './json-editor.component.html',
})
export class JsonEditorComponent implements AfterViewInit, OnChanges {

  public uuid : string;

  @Input("disabled") public disabled: boolean;

  @Input("data") public data: any;
  @Input("stringData") public stringData: any;
  @Output("jsonChange") public jsonChange = new EventEmitter<any>();
  @Output("stringChange") public stringChange = new EventEmitter<any>();


  @ViewChild('jsonEditor', { static: true }) jsonEditorRef: ElementRef;
  private jsonEditor: JSONEditor;
  private editorOptions: any;

  public valid: boolean = false;
  public hasChanges: boolean = false;

  constructor() {
    this.uuid = Math.floor(Math.random() * 100000000000) + "";
  }

  public ngAfterViewInit() {
    this.editorOptions = {
      mode: this.disabled ? 'view' : 'code',
      enableSort: false,
      enableTransform: false,
      onChange: () => this.handleChange()
    }
    this.jsonEditor = new JSONEditor(this.jsonEditorRef.nativeElement, this.editorOptions);
    if(!this.data && this.stringData) {
      this.data = JSON.parse(this.stringData);
    }
    this.jsonEditor.set(this.data || {});
  }

  public ngOnChanges(changes: SimpleChanges) {
    if(this.jsonEditor) {
      if((changes.data === undefined || !changes.data.currentValue) && (changes.stringData === undefined || !changes.stringData.currentValue)) {
        this.jsonEditor.set({});
      } else if (changes.data?.currentValue && JSON.stringify(changes.data.currentValue) !== JSON.stringify(this.jsonEditor.get())) {
        this.jsonEditor.set(changes.data.currentValue);
      } else if (changes.stringData?.currentValue && changes.stringData.currentValue !== JSON.stringify(this.jsonEditor.get())) {
        this.jsonEditor.set(JSON.parse(changes.stringData.currentValue));
      }
      this.hasChanges = false;
    }
  }

  private isValidJson() {
    try {
      JSON.parse(this.jsonEditor.getText());
      return true;
    } catch (e) {
      return false;
    }
  }

  private handleChange() {
    if (this.isValidJson()) {
      const data = this.jsonEditor.get();

      this.valid = true;
      this.hasChanges = JSON.stringify(data) !== JSON.stringify(this.data);

      this.jsonChange.emit(data);
      this.stringChange.emit(JSON.stringify(data));
    } else {
      this.hasChanges = true;
      this.valid = false;
    }
  }

}
