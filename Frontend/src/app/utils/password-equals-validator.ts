import { ValidatorFn, AbstractControl } from '@angular/forms';

export function equalsValidator(c1Name: string, c2Name: string, errorName: string, inputExists: boolean = false): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const equals = control.get(c1Name).value === control.get(c2Name).value;

    let invalid = !equals;
    if (inputExists) {
      invalid = invalid && control.get(c1Name).value
    }

    if (invalid) {
      control.get(c2Name).setErrors({
        [errorName]: true
      });
    } else {
      control.get(c2Name).setErrors(null);
    }

    return null;
  };
}
