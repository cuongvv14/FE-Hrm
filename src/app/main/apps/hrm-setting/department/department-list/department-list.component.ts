import { Component, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { ColumnMode, DatatableComponent } from "@swimlane/ngx-datatable";

import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

import { CoreConfigService } from "@core/services/config.service";
import { CoreSidebarService } from "@core/components/core-sidebar/core-sidebar.service";

import { DepartmentListService } from "./department-list.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { FlatpickrOptions } from "ng2-flatpickr";
import { FormBuilder, NgForm, Validators } from "@angular/forms";
import { BranchListService } from "../../branch/branch-list/branch-list.service";
@Component({
  selector: "app-department-list",
  templateUrl: "./department-list.component.html",
  styleUrls: ["./department-list.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class DepartmentListComponent implements OnInit {
  // Public
  public sidebarToggleRef = false;
  public rows;
  public selectedOption = 10;
  public ColumnMode = ColumnMode;
  public temp = [];
  public previousRoleFilter = "";
  public previousPlanFilter = "";
  public previousStatusFilter = "";

  public branches: any;
  public departments: any;
  public modalRef: any;

  public selectPlan: any = [
    { name: "All", value: "" },
    { name: "Basic", value: "Basic" },
    { name: "Company", value: "Company" },
    { name: "Enterprise", value: "Enterprise" },
    { name: "Team", value: "Team" },
  ];

  public selectStatus: any = [
    { name: "All", value: "" },
    { name: "Pending", value: "Pending" },
    { name: "Active", value: "Active" },
    { name: "Inactive", value: "Inactive" },
  ];

  public selectBranch = [];
  public selectedPlan1 = [];
  public selectedStatus1 = [];
  public searchValue1 = "";

  // Decorator
  @ViewChild(DatatableComponent) table: DatatableComponent;

  // Private
  private tempData = [];
  private _unsubscribeAll: Subject<any>;

  private form: any;

  /**
   * Constructor
   *
   * @param {CoreConfigService} _coreConfigService
   * @param {DepartmentListService} _departmentListService
   * @param {CoreSidebarService} _coreSidebarService
   */
  constructor(
    private _departmentListService: DepartmentListService,
    private _branchListService: BranchListService,
    private modalService: NgbModal,
    private _coreConfigService: CoreConfigService,
    private fb: FormBuilder
  ) {
    this._unsubscribeAll = new Subject();
    this.form = this.fb.group({
      departmentName: [
        "",
        [
          Validators.required,
          Validators.minLength(5),
          Validators.maxLength(255),
          Validators.pattern("^[^0-9]+$"),
        ],
      ],
      level: [
        "",
        [
          Validators.required,
          Validators.minLength(1),
          Validators.maxLength(10),
          Validators.pattern("^[0-9]+$"),
        ],
      ],
      branchId: [
        [
          Validators.required,
          Validators.pattern("^[0-9]+$"),
          Validators.minLength(1),
          Validators.maxLength(10),
        ],
      ],
      parentDepartmentId: [
        [
          Validators.required,
          Validators.minLength(1),
          Validators.maxLength(10),
          Validators.pattern("^[0-9]+$"),
        ],
      ],
    });
  }

  onSubmitReactiveForm(): void {
    if (this.form.valid) {
      const departmentData = this.form.value;

      departmentData.level = parseInt(departmentData.level, 10);

      this._departmentListService.createDepartment(departmentData).subscribe(
        (response) => {
          console.log("Thêm phòng ban thành công", response);
          if (this.modalRef) {
            this.modalRef.close();
          }
          this.loadData();
        },
        (error) => {
          console.error("Có lỗi xảy ra khi thêm phòng ban", error);
        }
      );
    } else {
      console.log("Form không hợp lệ");
    }
  }

  get DepartmentName() {
    return this.form.get("departmentName");
  }

  get Level() {
    return this.form.get("level");
  }

  get BranchId() {
    return this.form.get("branchId");
  }

  get ParentDepartmentId() {
    return this.form.get("parentDepartmentId");
  }

  // Public Methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * filterUpdate
   *
   * @param event
   */
  filterUpdate(event) {
    // Reset ng-select on search
    // this.selectBranch = this.selectRole[0];
    this.selectedPlan1 = this.selectPlan[0];
    this.selectedStatus1 = this.selectStatus[0];

    const val = event.target.value.toLowerCase();

    // Filter Our Data
    const temp = this.tempData.filter(function (d) {
      return d.departmentName.toLowerCase().indexOf(val) !== -1 || !val;
    });

    // Update The Rows
    this.rows = temp;
    // Whenever The Filter Changes, Always Go Back To The First Page
    this.table.offset = 0;
  }

  /**
   * Toggle the sidebar
   *
   * @param name
   */

  //Modal Basic
  modalOpen(modalBasic): void {
    this.form.reset();

    // Load branch and department data before opening the modal
    Promise.all([
      this._branchListService.getDataTableRows(), // Lấy dữ liệu chi nhánh
      this._departmentListService.getDataTableRows(), // Lấy dữ liệu phòng ban gốc
    ])
      .then(([branchResponse, departmentResponse]) => {
        this.branches = branchResponse; // Cập nhật danh sách chi nhánh
        this.departments = departmentResponse; // Cập nhật danh sách phòng ban gốc
        console.log("Branch Data:", this.branches);
        console.log("Department Data:", this.departments);

        // Sau khi có dữ liệu, mở modal
        this.modalRef = this.modalService.open(modalBasic, {
          size: "lg",
          centered: true,
          backdrop: "static",
          keyboard: false,
        });
      })
      .catch((error) => {
        console.error("Error loading data for modal:", error);
      });
  }

  /**
   * Filter By Roles
   *
   * @param event
   */
  filterByRole(event) {
    const filter = event ? event.value : "";
    this.previousRoleFilter = filter;
    this.temp = this.filterRows(
      filter,
      this.previousPlanFilter,
      this.previousStatusFilter
    );
    this.rows = this.temp;
  }

  /**
   * Filter By Plan
   *
   * @param event
   */
  filterByPlan(event) {
    const filter = event ? event.value : "";
    this.previousPlanFilter = filter;
    this.temp = this.filterRows(
      this.previousRoleFilter,
      filter,
      this.previousStatusFilter
    );
    this.rows = this.temp;
  }

  /**
   * Filter By Status
   *
   * @param event
   */
  filterByStatus(event) {
    const filter = event ? event.value : "";
    this.previousStatusFilter = filter;
    this.temp = this.filterRows(
      this.previousRoleFilter,
      this.previousPlanFilter,
      filter
    );
    this.rows = this.temp;
  }

  /**
   * Filter Rows
   *
   * @param roleFilter
   * @param planFilter
   * @param statusFilter
   */
  filterRows(roleFilter, planFilter, statusFilter): any[] {
    // Reset search on select change
    this.searchValue1 = "";

    roleFilter = roleFilter.toLowerCase();
    planFilter = planFilter.toLowerCase();
    statusFilter = statusFilter.toLowerCase();

    return this.tempData.filter((row) => {
      const isPartialNameMatch =
        row.role.toLowerCase().indexOf(roleFilter) !== -1 || !roleFilter;
      const isPartialGenderMatch =
        row.currentPlan.toLowerCase().indexOf(planFilter) !== -1 || !planFilter;
      const isPartialStatusMatch =
        row.status.toLowerCase().indexOf(statusFilter) !== -1 || !statusFilter;
      return isPartialNameMatch && isPartialGenderMatch && isPartialStatusMatch;
    });
  }

  // Lifecycle Hooks
  // -----------------------------------------------------------------------------------------------------
  /**
   * On init
   */
  ngOnInit(): void {
    this._coreConfigService.config
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((config) => {
        //! If we have zoomIn route Transition then load datatable after 450ms(Transition will finish in 400ms)
        if (config.layout.animation === "zoomIn") {
          setTimeout(() => {
            this._departmentListService.onUserListChanged
              .pipe(takeUntil(this._unsubscribeAll))
              .subscribe((response) => {
                this.rows = response;
                this.tempData = this.rows;
              });
            this._branchListService.onBranchListChanged
              .pipe(takeUntil(this._unsubscribeAll))
              .subscribe((branchResponse) => {
                console.log("Branch Data:", branchResponse);
                this.branches = branchResponse;
              });
            this.loadParentDepartments(); // Gọi hàm loadParentDepartments ở đây
          }, 450);
        } else {
          this.loadData();
          this.loadParentDepartments(); // Gọi hàm loadParentDepartments ở đây
        }
      });
  }

  loadData(): void {
    Promise.all([
      this._departmentListService.getDataTableRows(), // API call for department data
      this._branchListService.getDataTableRows(), // API call for branch data
    ])
      .then(([departmentResponse, branchResponse]) => {
        this.rows = departmentResponse; // Set department data
        this.tempData = this.rows;
        this.branches = branchResponse; // Set branch data
        console.log("Branch Data:", this.branches);
      })
      .catch((error) => {
        console.error("Error loading data:", error);
      });
  }

  loadParentDepartments(): void {
    this._departmentListService
      .getDataTableRows()
      .then((departmentResponse) => {
        this.departments = departmentResponse; // Dữ liệu phòng ban gốc
        console.log("Department Data:", this.departments); // Logging để kiểm tra dữ liệu trả về
      })
      .catch((error) => {
        console.error("Error loading departments:", error);
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
