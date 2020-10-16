import { Pipe, PipeTransform, NgModule } from "@angular/core";

@Pipe({
  name: "objToArr"
})
export class ObjectToArrayPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    if (!value) {
      return value;
    }
    return Object.entries(value).map(e => ({ key: e[0], value: e[1] }));
  }

}

@NgModule({
  declarations: [
    ObjectToArrayPipe
  ],
  exports: [
    ObjectToArrayPipe
  ]
})
export class ObjectToArrayPipeModule { }
