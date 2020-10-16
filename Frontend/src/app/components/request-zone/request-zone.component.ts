import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import * as jsonata from 'jsonata';
import { IMappingPair } from '~/app/models/mapping.model';
import { MappingService } from '~/app/services/mapping.service';
import { RequestService } from '~/app/services/request.service';
import { ValidationService } from '~/app/services/validation.service';
import { OpenApiValidationError } from '~/app/utils/errors/validation-error';
import { getRequestUrls } from '~/app/utils/swagger-parser';
import { stringifyedToJsonata } from '~/app/utils/jsonata-helpers';
import { IOpenApiInterface } from '~/app/models/api-interface.model';

@Component({
  selector: 'app-request-zone',
  templateUrl: './request-zone.component.html',
})
export class RequestZoneComponent implements OnInit, OnChanges {

  @Input("leftHeading") public leftHeading: string;
  @Input("rightHeading") public rightHeading: string;

  @Input("inputData") public inputData: any;
  public currentInputData: any;
  public outputData: any;

  public endpoints: Array<{url: string, method: string}> = [];

  @Input("mappingSource") public mappingSource: IOpenApiInterface;
  @Input("mappingTargets") public mappingTargets: { [key: string]: IOpenApiInterface };

  @Input("requestMappingPairs") public requestMappingPairs: Array<IMappingPair>;
  @Input("responseMappingPairs") public responseMappingPairs: Array<IMappingPair>;

  public mappingError: OpenApiValidationError;

  constructor(
    private requestService: RequestService,
    private mappingService: MappingService,
    private validationService: ValidationService
  ) { }

  public ngOnInit() {
    this.outputData = undefined;
  }

  public async ngOnChanges(changes: SimpleChanges) {
    if (changes.inputData) {
      this.currentInputData = this.inputData;
    }
    if (changes.mappingTargets) {
      if (this.mappingTargets) {
        this.endpoints = await getRequestUrls(this.mappingTargets);
      }
    }
    this.ngOnInit();
  }

  public async testRequest() {
    const mapping = this.mappingService.buildOpenApiMapping(this.mappingSource, this.mappingTargets, this.requestMappingPairs, this.responseMappingPairs);
    try {
      await this.validationService.validateOpenApiMappingComplete(this.mappingSource, this.mappingTargets, mapping);
      this.mappingError = undefined;

      const targetInputData = jsonata(stringifyedToJsonata(mapping.requestMapping)).evaluate(this.currentInputData);
      this.endpoints = await getRequestUrls(this.mappingTargets, targetInputData);

      this.outputData = await this.requestService.sendRequest(this.currentInputData, mapping, this.mappingTargets);
    } catch (err) {
      if (err instanceof OpenApiValidationError) {
        this.outputData = {};
        this.mappingError = err;
        return;
      }
      throw err;
    }
  }

}
