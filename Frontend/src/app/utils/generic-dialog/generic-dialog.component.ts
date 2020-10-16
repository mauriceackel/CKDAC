import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  templateUrl: './generic-dialog.component.html'
})
export class GenericDialog implements OnInit {
  public title: string;
  public content: string;
  public buttons: Array<ButtonType>;

  constructor(@Inject(MAT_DIALOG_DATA) public data: {
    title: string,
    content: string,
    buttons: Array<ButtonType>
  }, private dialogRef: MatDialogRef<GenericDialog>) {
    this.title = data.title;
    this.content = data.content;
    this.buttons = data.buttons;
  }

  async ngOnInit() {

  }

}

enum Appearance {
  WARN = "warn",
  HIGHLIGHT = "primary",
  DEFAULT = ""
}

export class ButtonType {

  public static YES = new ButtonType("Yes", Appearance.DEFAULT);
  public static NO = new ButtonType("No", Appearance.DEFAULT);
  public static CANCEL = new ButtonType("Cancel", Appearance.WARN);
  public static OK = new ButtonType("Ok", Appearance.DEFAULT);

  private appearance: Appearance;
  public get Appearance(): Appearance {
    return this.appearance;
  }

  private text: string;
  public get Text(): string {
    return this.text;
  }

  constructor(text: string, appearance: Appearance) {
    this.text = text;
    this.appearance = appearance;
  }
}


//How to use:
// const dialogRef: MatDialogRef<GenericDialog, ReturnType> = this.dialog.open(GenericDialog, {
//   data: {
//     title: "Test",
//     content: "Bla",
//     buttons: [ButtonType.YES, ButtonType.NO] //Order from left to right
//   },
//   width: '250px',
// });

// dialogRef.afterClosed().subscribe(result => {
//   if (result) {
//     xyz
//   }
// });
