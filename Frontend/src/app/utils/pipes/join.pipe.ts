import { NgModule, Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "join"
})
export class JoinPipe implements PipeTransform {

  transform(array: Array<any>, sep = ', '): string {
    if (Array.isArray(array)) {
      return array.join(sep)
    }
  }

}

@NgModule({
  declarations: [
    JoinPipe
  ],
  exports: [
    JoinPipe
  ]
})
export class JoinPipeModule { }
