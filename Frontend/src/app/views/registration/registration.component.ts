import { Component, OnInit } from '@angular/core';
import { FormControl, Validators, FormGroup } from '@angular/forms';
import { IUser } from '~/app/models/user-model';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { RegistrationService } from '~/app/services/auth/registration.service';
import { GenericDialog, ButtonType } from '~/app/utils/generic-dialog/generic-dialog.component';
import { equalsValidator } from '~/app/utils/password-equals-validator';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss']
})
export class RegistrationComponent implements OnInit {

  public firstName = new FormControl('', [Validators.required]);
  public lastName = new FormControl('', [Validators.required]);
  public email = new FormControl('', [Validators.required, Validators.email]);
  public password = new FormControl('', [Validators.required, Validators.minLength(8),]);
  public passwordConfirmation = new FormControl('');
  public registrationForm = new FormGroup({
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    password: this.password,
    passwordConfirmation: this.passwordConfirmation
  }, { validators: [equalsValidator('password', 'passwordConfirmation', 'pwMismatch')] });

  constructor(
    private registrationService: RegistrationService,
    private dialog: MatDialog,
    private router: Router,
  ) { }

  ngOnInit() { }

  async register() {
    let user: IUser = {
      id: undefined,
      email: this.email.value,
      type: 0,
      firstname: this.firstName.value,
      lastname: this.lastName.value,
      password: this.password.value,
    }
    try {
      let result = await this.registrationService.registerUser(user);
      if (result) {
        this.onSuccessfulRegistration();
      } else {
        this.registrationForm.setErrors({ duplicate: true });
      }
    } catch (err) {
      this.registrationForm.setErrors({ error: true });
    }
  }

  private onSuccessfulRegistration() {
    const dialogRef: MatDialogRef<GenericDialog, void> = this.dialog.open(GenericDialog, {
      position: {
        top: "5%"
      },
      data: {
        title: "Registration Success",
        content: "You successfully registered an account. You will now be redirected to the login page.",
        buttons: [ButtonType.YES]
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      this.router.navigateByUrl('/home/login');
    });
  }
}
