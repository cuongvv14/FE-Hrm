import { Component, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { ColumnMode, DatatableComponent } from "@swimlane/ngx-datatable";

import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

import { CoreConfigService } from "@core/services/config.service";
import { CoreSidebarService } from "@core/components/core-sidebar/core-sidebar.service";
import { PositionListService } from "./position-list.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { FlatpickrOptions } from "ng2-flatpickr";
import { FormBuilder, NgForm, Validators } from "@angular/forms";
import { DepartmentListService } from "../../department/department-list/department-list.service";

@Component({
  selector: "app-position-list",
  templateUrl: "./position-list.component.html",
  styleUrls: ["./position-list.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class PositionListComponent implements OnInit {
  // Public
  public sidebarToggleRef = false;
  public rows;
  public selectedOption = 10;
  public ColumnMode = ColumnMode;
  public temp = [];
  public previousRoleFilter = "";
  public previousPlanFilter = "";
  public previousStatusFilter = "";

  public departments: any;
  public positions: any;
  public modalRef: any;

  public selectRole: any = [
    { name: "All", value: "" },
    { name: "Admin", value: "Admin" },
    { name: "Author", value: "Author" },
    { name: "Editor", value: "Editor" },
    { name: "Maintainer", value: "Maintainer" },
    { name: "Subscriber", value: "Subscriber" },
  ];

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

  public selectedRole1 = [];
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
   * @param {PositionListService} _positionListService
   * @param {CoreSidebarService} _coreSidebarService
   */
  constructor(
    private _positionListService: PositionListService,
    private _departmentListService: DepartmentListService,
    private _coreConfigService: CoreConfigService,
    private modalService: NgbModal,
    private fb: FormBuilder
  ) {
    this._unsubscribeAll = new Subject();
    this.form = this.fb.group({
      positionName: [
        "",
        [
          Validators.required,
          Validators.minLength(1),
          Validators.maxLength(255),
          Validators.pattern("^[^0-9]+$"),
        ],
      ],
      departmentId: [
        "",
        [
          Validators.required,
          Validators.pattern("^[0-9]+$"),
          Validators.minLength(1),
          Validators.maxLength(10),
        ],
      ],
    });
  }

  // Public Methods
  // -----------------------------------------------------------------------------------------------------

  onSubmitReactiveForm(): void {
    if (this.form.valid) {
      const positionData = this.form.value;

      this._positionListService.createPosition(positionData).subscribe(
        (response) => {
          if (this.modalRef) {
            this.modalRef.close();
          }
          this.loadData();
        },
        (error) => {
          console.error("Có lỗi xảy ra khi thêm chức vụ:", error); // Error handling
        }
      );
    } else {
      console.log("Form không hợp lệ"); // Form is invalid
    }
  }
  get PositionName() {
    return this.form.get("positionName");
  }

  get DepartmentId() {
    return this.form.get("departmentId");
  }

  /**
   * filterUpdate
   *
   * @param event
   */
  filterUpdate(event) {
    // Reset ng-select on search
    this.selectedRole1 = this.selectRole[0];
    this.selectedPlan1 = this.selectPlan[0];
    this.selectedStatus1 = this.selectStatus[0];

    const val = event.target.value.toLowerCase();

    // Filter Our Data
    const temp = this.tempData.filter(function (d) {
      return d.fullName.toLowerCase().indexOf(val) !== -1 || !val;
    });

    // Update The Rows
    this.rows = temp;
    // Whenever The Filter Changes, Always Go Back To The First Page
    this.table.offset = 0;
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
  // modal Basic
  modalOpen(modalBasic): void {
    this.form.reset();

    this.modalRef = this.modalService.open(modalBasic, {
      size: "lg",
      centered: true,
      backdrop: "static",
      keyboard: false,
    });
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
    // Subscribe to config changes
    this._coreConfigService.config
      .pipe(takeUntil(this._unsubscribeAll)) // Unsubscribe when component is destroyed
      .subscribe((config) => {
        //! If there is zoomIn route transition, delay the datatable load
        if (config.layout.animation === "zoomIn") {
          setTimeout(() => {
            this._positionListService.onPositionListChanged
              .pipe(takeUntil(this._unsubscribeAll))
              .subscribe((response) => {
                this.rows = response;
                this.tempData = this.rows;
              });
            this._positionListService.onPositionListChanged
              .pipe(takeUntil(this._unsubscribeAll))
              .subscribe((branchResponse) => {
                console.log("Branch Data:", branchResponse);
                this.positions = branchResponse;
              });
            this.loadParentDepartments(); // Call load positions
          }, 450);
        } else {
          // Load data immediately if no transition is required
          this.loadData();
          this.loadParentDepartments();
        }
      });
  }
  loadData(): void {
    Promise.all([
      this._departmentListService.getDataTableRows(), // API call for department data
      this._positionListService.getDataTableRows(), // API call for branch data
    ])
      .then(([departmentResponse, positionResponse]) => {
        this.rows = departmentResponse; // Set department data
        this.tempData = this.rows;
        this.positions = positionResponse; // Set Position data
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
