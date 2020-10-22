import { CdkOverlayOrigin, Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal, PortalInjector } from '@angular/cdk/portal';
import { Component, Injector, ViewChild } from '@angular/core';
import { USER_INPUT_ACCOUNTCARD, AccountCardComponent } from '~/app/components/account-card/account-card.component';
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
            <button cdkOverlayOrigin #accountCardOrigin="cdkOverlayOrigin" mat-mini-fab class="float-right" (click)="openAccountCard($event)">
              <mat-icon>person</mat-icon>
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
  @ViewChild('accountCardOrigin') accountCardOrigin!: CdkOverlayOrigin;

  constructor(
    private overlay: Overlay,
    private injector: Injector,
    public identificationService: AuthenticationService
  ) { }

  async openAccountCard(event: MouseEvent) {
    if(this.identificationService.AuthUser) {
      let overlayRef = this.overlay.create({
        hasBackdrop: true,
        backdropClass: "transparent-backdrop",
        disposeOnNavigation: false,
        scrollStrategy: this.overlay.scrollStrategies.noop(),
        positionStrategy: this.overlay.position().connectedTo(this.accountCardOrigin.elementRef, { originX: 'end', originY: 'bottom' }, { overlayX: 'end', overlayY: 'top' }),
      });

      let injectionData = new WeakMap();
      injectionData.set(USER_INPUT_ACCOUNTCARD, this.identificationService.AuthUser);
      injectionData.set(OverlayRef, overlayRef);
      let accountCardPortal = new ComponentPortal(AccountCardComponent, null, new PortalInjector(this.injector, injectionData));

      overlayRef.attach(accountCardPortal);
      overlayRef.backdropClick().subscribe(() => overlayRef.dispose());
    }
  }

}
