import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import {
  ActivatedRouteSnapshot,
  Resolve,
  RouterStateSnapshot,
} from "@angular/router";
import { environment } from "environments/environment";
import { BehaviorSubject, Observable } from "rxjs";
import { catchError, map } from "rxjs/operators";

@Injectable()
export class BranchListService implements Resolve<any> {
  public rows: any[] = []; // Khởi tạo rows là một mảng trống
  public onBranchListChanged: BehaviorSubject<any>;

  /**
   * Constructor
   *
   * @param {HttpClient} _httpClient
   */
  constructor(private _httpClient: HttpClient) {
    // Set the defaults
    this.onBranchListChanged = new BehaviorSubject([]);
  }

  /**
   * Resolver
   *
   * @param {ActivatedRouteSnapshot} route
   * @param {RouterStateSnapshot} state
   * @returns {Observable<any> | Promise<any> | any}
   */
  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<any> | Promise<any> | any {
    return new Promise<void>((resolve, reject) => {
      Promise.all([this.getDataTableRows()]).then(() => {
        resolve();
      }, reject);
    });
  }

  /**
   * Get rows
   */
  getDataTableRows(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this._httpClient
        .get(`${environment.apiUrl}/branch`)
        .pipe(
          map((response: any) => {
            // Giả định API trả về một đối tượng chứa dữ liệu chi nhánh
            if (response && response.data) {
              return response.data;
            } else {
              return [];
            }
          }),
          catchError((error) => {
            console.error("Error fetching branch data:", error);
            return [];
          })
        )
        .subscribe((data: any[]) => {
          this.rows = data; // Gán dữ liệu cho rows
          console.log("Branches fetched:", data);
          this.onBranchListChanged.next(this.rows); // Đẩy dữ liệu mới vào BehaviorSubject
          resolve(this.rows);
        }, reject);
    });
  }

  /**
   * Create new branch (POST request to API)
   * @param branchData - Data of the new branch to be created
   */
  createBranch(branchData: any): Observable<any> {
    return this._httpClient
      .post(`${environment.apiUrl}/branch`, branchData)
      .pipe(
        map((response: any) => {
          console.log("Branch created successfully:", response);
          return response;
        }),
        catchError((error) => {
          console.error("Error creating branch:", error);
          throw error;
        })
      );
  }
}
