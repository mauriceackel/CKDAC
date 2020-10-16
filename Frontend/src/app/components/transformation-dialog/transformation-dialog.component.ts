import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { KeyChain } from '~/app/utils/json-tree';
import { buildJSONataKey } from '~/app/utils/jsonata-helpers';

@Component({
  templateUrl: './transformation-dialog.component.html'
})
export class TransformationDialog implements OnInit {
  public mappingCode: string;
  public keys: string[];

  @ViewChild('mappingCodeArea') mappingCodeArea: ElementRef<HTMLTextAreaElement>

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { mappingCode: string, keys: KeyChain[] },
    private dialogRef: MatDialogRef<TransformationDialog>
  ) {
    this.mappingCode = data.mappingCode;
    this.keys = data.keys.map(kC => buildJSONataKey(kC))
  }

  public insertKey(key: string) {
    this.mappingCodeArea.nativeElement.focus();
    document.execCommand("insertText", false, key);
  }

  async ngOnInit() {

  }

}
