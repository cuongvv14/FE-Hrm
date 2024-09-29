import { Component, OnInit, ViewEncapsulation, OnDestroy } from "@angular/core";
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from "@angular/forms";

import { first, takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";

import { CoreConfigService } from "@core/services/config.service";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthenticationService } from "app/auth/service";

@Component({
  selector: "app-auth-register-v2",
  templateUrl: "./auth-register-v2.component.html",
  styleUrls: ["./auth-register-v2.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class AuthRegisterV2Component implements OnInit, OnDestroy {
  // Public
  public coreConfig: any;
  public passwordTextType: boolean = false;
  public confPasswordTextType: boolean = false;
  public registerForm: UntypedFormGroup;
  public submitted = false;
  public error = "";
  public loading = false;
  public returnUrl: string;

  // Private
  private _unsubscribeAll: Subject<any> = new Subject();

  /**
   * Constructor
   */

  constructor(
    private _coreConfigService: CoreConfigService,
    private _authenticationService: AuthenticationService,
    private _formBuilder: UntypedFormBuilder,
    private _route: ActivatedRoute,
    private _router: Router
  ) {
    // Configure the layout
    this._coreConfigService.config = {
      layout: {
        navbar: { hidden: true },
        menu: { hidden: true },
        footer: { hidden: true },
        customizer: false,
        enableLocalStorage: false,
      },
    };
  }

  // Convenience getter for easy access to form fields
  get f() {
    return this.registerForm.controls;
  }

  /**
   * Custom validator to check if password and confirm password match
   */
  mustMatch(password: string, confirmPassword: string) {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const passControl = formGroup.get(password);
      const confirmPassControl = formGroup.get(confirmPassword);

      if (!passControl || !confirmPassControl) {
        return null;
      }

      if (
        confirmPassControl.errors &&
        !confirmPassControl.errors["mustMatch"]
      ) {
        return null;
      }

      // So sánh giá trị của mật khẩu và xác nhận mật khẩu
      if (passControl.value !== confirmPassControl.value) {
        confirmPassControl.setErrors({ mustMatch: true });
      } else {
        confirmPassControl.setErrors(null);
      }

      return null;
    };
  }

  /**
   * Toggle password visibility
   */
  togglePasswordTextType() {
    this.passwordTextType = !this.passwordTextType;
  }

  toggleConfPasswordTextType() {
    this.confPasswordTextType = !this.confPasswordTextType;
  }

  /**
   * On Submit
   */
  onSubmit() {
    this.submitted = true;

    // Stop here if the form is invalid
    if (this.registerForm.invalid) {
      return;
    }

    // Register
    this.loading = true;

    this._authenticationService
      .register(
        this.f.email.value,
        this.f.password.value,
        this.f.organizationName.value
      )
      .pipe(first())
      .subscribe(
        () => {
          // After successful registration, navigate to the login page
          this._router.navigate(["/pages/authentication/login-v2"]);
        },
        (error) => {
          this.error = error;
          this.loading = false;
        }
      );
  }

  /**
   * On init
   */
  ngOnInit(): void {
    // Initialize the registration form with validations
    this.registerForm = this._formBuilder.group(
      {
        email: [
          "",
          [Validators.required, Validators.email, Validators.maxLength(255)],
        ],
        password: [
          "",
          [
            Validators.required,
            Validators.minLength(8),
            Validators.maxLength(255),
            Validators.pattern(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W)/), // Pattern for strong password
          ],
        ],
        organizationName: [
          "",
          [
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(255),
          ],
        ],
        confirmPassword: ["", Validators.required],
        acceptTerms: [false, Validators.requiredTrue],
      },
      {
        validator: this.mustMatch("password", "confirmPassword"), // Custom validator
      }
    );

    // Get return url from route parameters or default to '/'
    this.returnUrl = this._route.snapshot.queryParams["returnUrl"] || "/";

    // Subscribe to config changes
    this._coreConfigService.config
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((config) => {
        this.coreConfig = config;
      });
  }

  // Getter methods for form controls to easily access validation in the template
  get email() {
    return this.registerForm.get("email");
  }

  get password() {
    return this.registerForm.get("password");
  }

  get organizationName() {
    return this.registerForm.get("organizationName");
  }

  /**
   * On destroy
   */
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }
}
