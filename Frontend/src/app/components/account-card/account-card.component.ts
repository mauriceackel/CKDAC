import { Component, OnInit, InjectionToken, Inject } from '@angular/core';
import { OverlayRef } from '@angular/cdk/overlay';
import { IUser } from '~/app/models/user-model';
import { AuthenticationService } from '~/app/services/auth/authentication.service';
import { Router } from '@angular/router';

export const USER_INPUT_ACCOUNTCARD = new InjectionToken<IUser>("USER_INPUT_ACCOUNTCARD");

@Component({
  selector: 'account-card',
  templateUrl: './account-card.component.html',
  styleUrls: ['./account-card.component.scss']
})
export class AccountCardComponent implements OnInit {

  constructor(
    @Inject(USER_INPUT_ACCOUNTCARD) public user: IUser,
    private overlayRef: OverlayRef,
    private authService: AuthenticationService,
    private router: Router
  ) { }

  ngOnInit() {
  }

  logout() {
    this.overlayRef.dispose();
    this.authService.logout();
  }

  edit() {
    this.router.navigateByUrl('/home/profile');
  }

}
