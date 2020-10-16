import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'target-select-dialog',
  template: `
    <h1 mat-dialog-title>Select an interface</h1>
    <div mat-dialog-content>
      <mat-form-field>
        <mat-label>Associated interface</mat-label>
        <mat-select [(value)]="selectedId">
          <mat-option *ngFor="let targetId of data.targetIds" [value]="targetId">
            {{targetId}}
          </mat-option>
        </mat-select>
      </mat-form-field>
    </div>
    <div mat-dialog-actions>
      <button mat-button [mat-dialog-close]="selectedId" cdkFocusInitial>Ok</button>
    </div>
  `,
})
export class TargetIdDialog {

  public selectedId: string;

  constructor(
    public dialogRef: MatDialogRef<TargetIdDialog, string>,
    @Inject(MAT_DIALOG_DATA) public data: { targetIds: string[] }
  ) {
    this.selectedId = data.targetIds.length > 0 && data.targetIds[0];
  }

}
