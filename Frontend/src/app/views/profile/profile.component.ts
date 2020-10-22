import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, Validators, FormGroup } from '@angular/forms';
import { IUser } from '~/app/models/user-model';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '~/app/services/auth/user.service';
import { GenericDialog, ButtonType } from '~/app/utils/generic-dialog/generic-dialog.component';
import { AuthenticationService } from '~/app/services/auth/authentication.service';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { equalsValidator } from '~/app/utils/password-equals-validator';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {


  public firstName = new FormControl('', [Validators.required]);
  public lastName = new FormControl('', [Validators.required]);
  public email = new FormControl('', [Validators.required, Validators.email]);
  public password = new FormControl('', [Validators.minLength(8),]);
  public passwordConfirmation = new FormControl('');
  public updateForm = new FormGroup({
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    password: this.password,
    passwordConfirmation: this.passwordConfirmation
  }, { validators: [equalsValidator('password', 'passwordConfirmation', 'pwMismatch', true)] });
  private userId: string;

  private subscription: Subscription;

  constructor(
    private userService: UserService,
    private dialog: MatDialog,
    private router: Router,
    private identificationService: AuthenticationService
  ) { }

  ngOnInit() {
    this.subscription = this.identificationService.authUserObserver.pipe(
      filter(user => user !== undefined)
    ).subscribe(user => {
      console.log(user);
      if (user) {
        this.firstName.setValue(user.firstname);
        this.lastName.setValue(user.lastname);
        this.email.setValue(user.email);
        this.userId = user.id;
      }
    })
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  async update() {
    let user: IUser = {
      id: this.userId,
      email: this.email.value,
      type: 0,
      firstname: this.firstName.value,
      lastname: this.lastName.value,
    }
    if(this.password.value) {
      user.password = this.password.value
    }

    try {
      let result = await this.userService.updateUser(user);
      if (result) {
        this.identificationService.refreshUser();
        this.onSuccessfulUpdate();
      } else {
        this.updateForm.setErrors({ duplicate: true });
      }
    } catch (err) {
      this.updateForm.setErrors({ error: true });
    }
  }

  private onSuccessfulUpdate() {
    const dialogRef: MatDialogRef<GenericDialog, void> = this.dialog.open(GenericDialog, {
      position: {
        top: "5%"
      },
      data: {
        title: "Update Success",
        content: "You successfully updated your account!",
        buttons: [ButtonType.YES]
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      this.router.navigateByUrl('/home');
    });
  }
}
