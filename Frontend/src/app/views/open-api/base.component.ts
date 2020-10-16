import { Component } from '@angular/core';
import { AuthenticationService } from '~/app/services/auth/authentication.service';

@Component({
  selector: 'app-openapi',
  template: `
  <mat-toolbar class="toolbar" color="primary">
    <div class="row flex-grow-1">

        <div [routerLink]="['/home']" class="col-3 cursor-pointer">
          Home
        </div>

        <div class="col-6 d-flex justify-content-center">
          <button mat-button class="mx-1" [routerLink]="['home']" routerLinkActive="link-active">Explanation</button>
          <button mat-button class="mx-1" [routerLink]="['transformation']" routerLinkActive="link-active">Transformation</button>
          <button mat-button class="mx-1" [routerLink]="['describe']" routerLinkActive="link-active">Add API</button>
        </div>

        <div class="col-3">
          <div *ngIf="identificationService.AuthUser as user" class="float-right">
            <span style="font-size: 12pt">{{user.email}}</span>
            <button mat-icon-button (click)="identificationService.logout()">
              <mat-icon>logout</mat-icon>
            </button>
          </div>
        </div>

    </div>
  </mat-toolbar>
  <div class="container-fluid px-5 py-4">
    <router-outlet></router-outlet>
  </div>`,
})
export class BaseComponent {

  constructor(
    public identificationService: AuthenticationService
  ) { }

}
