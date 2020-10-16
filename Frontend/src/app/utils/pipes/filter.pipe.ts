import { NgModule, Pipe, PipeTransform } from "@angular/core";
import { IApi } from '~/app/models/api.model';

@Pipe({
  name: "filter"
})
export class FilterPipe implements PipeTransform {

  transform(array: Array<IApi>, filter: string): Array<IApi> {
    if (Array.isArray(array) && filter) {
      return array.filter((api) => {
        return api.name.includes(filter) || Object.values(api.metadata).some(v => v.includes(filter));
      })
    }
    return array;
  }

}

@NgModule({
  declarations: [
    FilterPipe
  ],
  exports: [
    FilterPipe
  ]
})
export class FilterPipeModule { }
