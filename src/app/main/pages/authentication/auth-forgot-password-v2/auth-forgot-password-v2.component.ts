import {
  Component,
  OnInit,
  TemplateRef,
  ViewChild,
  ViewEncapsulation,
} from "@angular/core";
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";
import { Router } from "@angular/router"; // Import Router

import { CoreConfigService } from "@core/services/config.service";

@Component({
  selector: "app-auth-forgot-password-v2",
  templateUrl: "./auth-forgot-password-v2.component.html",
  styleUrls: ["./auth-forgot-password-v2.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class AuthForgotPasswordV2Component implements OnInit {
  // Public variables
  public emailVar;
  public coreConfig: any;
  public forgotPasswordForm: UntypedFormGroup;
  public otpForm: UntypedFormGroup; // Form for OTP
  public submitted = false;
  public submittedOtp = false; // Track OTP submission
  public showOtpForm = false; // Track whether to show OTP form or not

  // Reference for OTP modal template
  @ViewChild("otpModalTemplate") otpModalTemplate: TemplateRef<any>;

  // Private subject for cleanup
  private _unsubscribeAll: Subject<any>;

  /**
   * Constructor
   *
   * @param {CoreConfigService} _coreConfigService
   * @param {FormBuilder} _formBuilder
   * @param {NgbModal} modalService
   * @param {Router} router // Inject the Router here
   *
   */
  constructor(
    private _coreConfigService: CoreConfigService,
    private _formBuilder: UntypedFormBuilder,
    private modalService: NgbModal,
    private router: Router // Inject Router for navigation
  ) {
    this._unsubscribeAll = new Subject();

    // Configure the layout
    this._coreConfigService.config = {
      layout: {
        navbar: {
          hidden: true,
        },
        menu: {
          hidden: true,
        },
        footer: {
          hidden: true,
        },
        customizer: false,
        enableLocalStorage: false,
      },
    };
  }

  // convenience getter for easy access to form fields
  get f() {
    return this.forgotPasswordForm.controls;
  }

  get fOtp() {
    return this.otpForm.controls;
  }

  /**
   * Handle the form submission for email (forgot password)
   */
  onSubmit() {
    this.submitted = true;

    // stop here if form is invalid
    if (this.forgotPasswordForm.invalid) {
      return;
    }

    // Simulate sending the reset password email
    console.log(
      "Reset password link sent to:",
      this.forgotPasswordForm.value.email
    );

    // Switch to OTP form
    this.showOtpForm = true;
  }

  /**
   * Handle the form submission for OTP verification
   */
  onSubmitOtp() {
    this.submittedOtp = true;

    // stop here if form is invalid
    if (this.otpForm.invalid) {
      return;
    }

    // Perform OTP verification logic here
    console.log("OTP Verified:", this.otpForm.value.otp);

    // If OTP is valid, navigate to the reset password component
    this.router.navigate(["/pages/authentication/reset-password-v2"]);

    // Optionally, reset form states if needed
    this.showOtpForm = false;
    this.submittedOtp = false;
    this.otpForm.reset();
  }

  // Lifecycle Hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {
    // Initialize the forgot password form
    this.forgotPasswordForm = this._formBuilder.group({
      email: [
        "",
        [
          Validators.required,
          Validators.pattern("^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$"),
        ],
      ],
    });

    // Initialize the OTP form
    this.otpForm = this._formBuilder.group({
      otp: ["", [Validators.required, Validators.minLength(6)]],
    });

    // Subscribe to config changes
    this._coreConfigService.config
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((config) => {
        this.coreConfig = config;
      });
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
