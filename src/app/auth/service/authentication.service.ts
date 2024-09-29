import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { BehaviorSubject, Observable, throwError } from "rxjs";
import { catchError, map } from "rxjs/operators";

import { environment } from "environments/environment";
import { User, Role } from "app/auth/models";
import { ToastrService } from "ngx-toastr";
import { Router } from "@angular/router";

@Injectable({ providedIn: "root" })
export class AuthenticationService {
  //public
  public currentUser: Observable<User>;

  //private
  private currentUserSubject: BehaviorSubject<User>;

  /**
   *
   * @param {HttpClient} _http
   * @param {ToastrService} _toastrService
   */
  constructor(
    private _http: HttpClient,
    private router: Router,
    private _toastrService: ToastrService
  ) {
    this.currentUserSubject = new BehaviorSubject<User>(
      JSON.parse(localStorage.getItem("currentUser"))
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  // getter: currentUserValue
  public get currentUserValue(): User {
    return this.currentUserSubject.value;
  }

  /**
   *  Confirms if user is admin
   */
  get isAdmin() {
    return (
      this.currentUser && this.currentUserSubject.value.role === Role.Admin
    );
  }

  /**
   *  Confirms if user is client
   */
  get isClient() {
    return (
      this.currentUser && this.currentUserSubject.value.role === Role.Client
    );
  }

  /**
   * User login
   *
   * @param email
   * @param password
   * @returns user
   */
  login(email: string, password: string) {
    return this._http
      .post<any>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        map((user) => {
          // login successful if there's a jwt token in the response
          if (user && user.data.accessToken) {
            console.log("user", user);
            // store user details and jwt token in local storage to keep user logged in between page refreshes
            localStorage.setItem("currentUser", JSON.stringify(user));

            // Display welcome toast!
            setTimeout(() => {
              this._toastrService.success(
                "You have successfully logged in as an " +
                  user.role +
                  " user to Vuexy. Now you can start to explore. Enjoy! 🎉",
                "👋 Welcome, " + user.firstName + "!",
                { toastClass: "toast ngx-toastr", closeButton: true }
              );
            }, 2500);

            // notify
            this.currentUserSubject.next(user);
          }

          return user;
        })
      );
  }

  /**
   * User register
   *
   * @param email
   * @param password
   * @returns user
   */
  register(email: string, password: string, organizationName: string) {
    return this._http
      .post<any>(`${environment.apiUrl}/auth/register`, {
        email,
        password,
        organizationName,
      })
      .pipe(
        map((response) => {
          console.log("user", response);

          // Registration successful if there's a jwt token in the response
          if (response.status === 200) {
            // Display welcome toast
            setTimeout(() => {
              this._toastrService.success(
                "You have successfully registered. Now you can start to explore. Enjoy! 🎉",
                "👋 Welcome, " + response.firstName + "!",
                { toastClass: "toast ngx-toastr", closeButton: true }
              );
            }, 2500);

            // Notify
            this.currentUserSubject.next(response);

            // Redirect to login page
            this.router.navigate(["/auth/verify"]); // Add the redirect here
          }

          return response;
        })
      );
  }

  /**
   * User logout
   *
   */
  logout() {
    // remove user from local storage to log user out
    localStorage.removeItem("currentUser");
    // notify
    this.currentUserSubject.next(null);
  }
}
