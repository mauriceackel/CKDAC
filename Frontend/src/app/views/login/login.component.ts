import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../../services/auth/authentication.service';
import { Router, ActivatedRoute } from '@angular/router';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthError } from '~/app/utils/errors/auth-error';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  private returnUrl: string = '/';
  public identificationForm: FormGroup;

  constructor(
    private identificationService: AuthenticationService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  public ngOnInit() {
    this.identificationForm = new FormGroup({
      email: new FormControl(undefined, [Validators.required, Validators.email]),
      password: new FormControl(undefined, Validators.required),
    });
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  public async login() {
    try {
      await this.identificationService.login(this.identificationForm.get("email").value, this.identificationForm.get("password").value);
      this.router.navigateByUrl(this.returnUrl);
    } catch (err) {
      this.identificationForm.get("password").reset();
      this.identificationForm.setErrors({
        authError: 'Wrong username or password'
      });
    }
  }

  public goToRegister() {
    this.router.navigate(['/home/register'], { queryParams: { returnUrl: this.returnUrl } });
  }

}
