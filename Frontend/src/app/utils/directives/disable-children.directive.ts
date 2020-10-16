import { Directive, ElementRef, Input, OnChanges, SimpleChanges, NgModule } from '@angular/core';

@Directive({
  selector: '[disableChildren]'
})
export class DisableChildrenDirective implements OnChanges {

  @Input("disableChildren") disabled: boolean;

  constructor(private elem: ElementRef) {}

  private setDisabledState(elem: any, disabled: boolean) {
    if(elem.setAttribute) {
      if(disabled) {
        elem.setAttribute("disabled", true);
      } else {
        elem.removeAttribute("disabled");
      }
      const children = elem.childNodes;
      for(let i = 0; i < children.length; i++) {
        this.setDisabledState(children[i], disabled);
      }
    }
  }

  public ngOnChanges(changes: SimpleChanges) {
    if(changes.disabled) {
      this.setDisabledState(this.elem.nativeElement, changes.disabled.currentValue);
    }
  }

}

@NgModule({
  declarations: [
    DisableChildrenDirective
  ],
  exports: [
    DisableChildrenDirective
  ]
})
export class DisableChildrenModule { }
