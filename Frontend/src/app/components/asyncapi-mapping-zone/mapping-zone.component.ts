import { NestedTreeControl } from '@angular/cdk/tree';
import { Component, Input, OnChanges, OnInit, SimpleChanges, Output, EventEmitter, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { IMappingPair } from '~/app/models/mapping.model';
import { arrayEquals } from '~/app/utils/array-utils';
import { TransformationDialog } from '../transformation-dialog/transformation-dialog.component';
import { TargetIdDialog } from '../targetid-dialog/targetid.dialog';
import { JsonTreeNode, toTree } from '~/app/utils/json-tree';
import { buildJSONataKey } from '~/app/utils/jsonata-helpers';

@Component({
  selector: 'app-mapping-zone',
  templateUrl: './mapping-zone.component.html',
  styleUrls: ['./mapping-zone.component.scss']
})
export class MappingZoneComponent implements OnInit, OnChanges {

  @Input("isPublish") public isPublish: boolean;

  @Input("leftHeading") public leftHeading: string;
  @Input("rightHeading") public rightHeading: string;

  @Input("leftData") public leftData: any;
  @Input("rightData") public rightData: any;

  @Input("mappingPairs") public mappingPairs = new Array<IMappingPair>();
  @Output("mapSame") public mapSame = new EventEmitter();

  public leftTreeControl = new NestedTreeControl<JsonTreeNode>(node => node.children);
  public leftDataSource = new MatTreeNestedDataSource<JsonTreeNode>();

  public rightTreeControl = new NestedTreeControl<JsonTreeNode>(node => node.children);
  public rightDataSource = new MatTreeNestedDataSource<JsonTreeNode>();

  public selectedLeft: Array<JsonTreeNode>;
  public selectedRight: Array<JsonTreeNode>;

  constructor(
    private dialog: MatDialog
  ) { }

  public ngOnInit() {
    if (this.mappingPairs instanceof Array) {
      this.mappingPairs.splice(0);
    } else {
      this.mappingPairs = new Array<IMappingPair>();
    }

    this.leftDataSource.data = toTree(this.leftData);
    this.leftTreeControl.dataNodes = this.leftDataSource.data;
    if (this.leftDataSource.data.length !== 0) this.leftTreeControl.expandAll();

    this.rightDataSource.data = toTree(this.rightData);
    this.rightTreeControl.dataNodes = this.rightDataSource.data;
    if (this.rightDataSource.data.length !== 0) this.rightTreeControl.expandAll();

    this.selectedLeft = new Array<JsonTreeNode>();
    this.selectedRight = new Array<JsonTreeNode>();
  }

  public ngOnChanges(changes: SimpleChanges) {
    this.ngOnInit();
  }

  public async mapSelected() {
    if (this.isPublish) {
      this.mappingPairs.push({
        provided: this.selectedLeft.map(n => n.keyChain),
        required: this.selectedRight[0].keyChain,
        mappingCode: this.selectedLeft.length === 1 ? buildJSONataKey(this.selectedLeft[0].keyChain) : "",
      });
    } else {
      const provided = this.selectedRight.length === 0 ? (Object.keys(this.rightData).length === 1 ? [[Object.keys(this.rightData)[0]]] : [[await this.openDialog()]]) : this.selectedRight.map(n => n.keyChain)
      this.mappingPairs.push({
        provided,
        required: this.selectedLeft[0].keyChain,
        mappingCode: this.selectedRight.length === 1 ? buildJSONataKey(this.selectedRight[0].keyChain) : "",
      });
    }
    this.selectedLeft = new Array<JsonTreeNode>();
    this.selectedRight = new Array<JsonTreeNode>();
  }

  public openEditor(mappingPair: IMappingPair) {
    const dialogRef: MatDialogRef<TransformationDialog, string> = this.dialog.open(TransformationDialog, {
      position: {
        top: "5%",
        bottom: "5%",
      },
      width: "80%",
      data: {
        mappingCode: mappingPair.mappingCode,
        keys: mappingPair.provided
      }
    });

    dialogRef.afterClosed().subscribe((mappingCode) => {
      if (mappingCode !== undefined) {
        mappingPair.mappingCode = mappingCode;
      }
    });
  }

  public selectLeft(node: JsonTreeNode) {
    const index = this.selectedLeft.indexOf(node);
    if (index >= 0) {
      this.selectedLeft.splice(index, 1);
    } else if (this.isPublish || this.selectedLeft.length < 1) {
      this.selectedLeft.push(node);
    }
  }

  public selectRight(node: JsonTreeNode) {
    const index = this.selectedRight.indexOf(node);
    if (index >= 0) {
      this.selectedRight.splice(index, 1);
    } else if (!this.isPublish || this.selectedRight.length < 1) {
      this.selectedRight.push(node);
    }
  }

  public removePair(pair: IMappingPair) {
    const idx = this.mappingPairs.indexOf(pair);
    if (idx >= 0) this.mappingPairs.splice(idx, 1);
  }

  public isMapped(node: JsonTreeNode) {
    if (!this.isPublish) {
      //All targets mapped source prop
      const targetIds = Object.keys(this.rightData);
      const mappedByAllTargets = targetIds.every(targetId => this.mappingPairs.some(p => p.provided[0][0] === targetId && arrayEquals(p.required, node.keyChain)));
      //One target mapped source prop and keys from this target selected
      const mappedBySelected = this.selectedRight.length > 0 && this.mappingPairs.some(p => p.provided[0][0] === this.selectedRight[0].keyChain[0] && arrayEquals(p.required, node.keyChain))

      return mappedByAllTargets || mappedBySelected;
    } else {
      const mappedByOne = this.mappingPairs.some(p => arrayEquals(p.required, node.keyChain));
      return mappedByOne;
    }
  }

  public isDisabled(node: JsonTreeNode) {
    const idDiffers = this.selectedRight.some(n => n.keyChain[0] !== node.keyChain[0])
    return idDiffers;
  }

  async openDialog(): Promise<string> {
    const dialogRef = this.dialog.open(TargetIdDialog, {
      width: '250px',
      data: { targetIds: Object.keys(this.rightData) }
    });

    return dialogRef.afterClosed().toPromise();
  }

  public hasChild = (_: number, node: JsonTreeNode) => !!node.children && node.children.length > 0;
}

