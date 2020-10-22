import { CdkOverlayOrigin, Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal, PortalInjector } from '@angular/cdk/portal';
import { Component, Injector, OnInit, ViewChild } from '@angular/core';
import { USER_INPUT_ACCOUNTCARD, AccountCardComponent } from '~/app/components/account-card/account-card.component';
import { AuthenticationService } from '~/app/services/auth/authentication.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {

  @ViewChild('accountCardOrigin') accountCardOrigin!: CdkOverlayOrigin;

  constructor(
    private overlay: Overlay,
    private injector: Injector,
    public identificationService: AuthenticationService
  ) { }

  async openAccountCard(event: MouseEvent) {
    if (this.identificationService.AuthUser) {
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
