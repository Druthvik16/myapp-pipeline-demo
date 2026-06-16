import { Component, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UserService } from 'src/app/core/service/user/user.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-user-add',
  standalone: false,
  templateUrl: './user-add.component.html',
  styleUrl: './user-add.component.scss',
})
export class UserAddComponent {
  addUserForm!: FormGroup;
  alphaWithWithSpace = '^[A-Za-z]+([ ]?[A-Za-z])*$';
  emailpattern =
    /^[a-zA-Z][a-zA-Z0-9._%+-]+@[a-zA-Z][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  mobilePattern = '^(?!0{10}$)[0-9]{10}$';
  isValidForm!: boolean;
  roles: any = [];
  staffs: any = [];
  filteredRoles: any[] = [];
  selectedRoles: any[] = [];
  selectedRoleIds: number[] = [];
  selectedRoleIdsString: string = '';
  searchTerm: string = '';
  dropdownOpen: boolean = false;
  isAllSelected: boolean = false;
  isInitialLoad: boolean = true;

  constructor(
    private activeModal: NgbActiveModal,
    private formBuilder: FormBuilder,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.isValidForm = true;
    this.addUserForm = this.formBuilder.group({
      password: ['', [Validators.required]],
      roles: [null, Validators.required],
      staff: this.formBuilder.group({
        id: ['', Validators.required],
      }),
    });
    this.getRoles();
    this.getStaffs();
  }

  showNotification(header: string, message: string, labelicon: any) {
    Swal.fire({
      title: header,
      text: message,
      icon: labelicon,
      confirmButtonColor: '#364574',
      confirmButtonText: 'OK',
    });
  }

  async saveUser() {
    if (this.addUserForm.valid) {
      try {
        this.isValidForm = true;
        const payload = {
          staff_id: this.addUserForm.get('staff.id')?.value,
          role_ids: this.selectedRoleIds,
          password: this.addUserForm.get('password')?.value,
        };
        let response = await this.userService.createUser(payload).toPromise();
        if (
          response.status_code == 200 &&
          response.message == 'User created successfully'
        ) {
          this.showNotification(
            'Success',
            'User created successfully',
            'success'
          );
          this.activeModal.close('success');
        }
      } catch (error: any) {
        this.showNotification('Error', error, 'error');
        this.isValidForm = false;
      }
    } else {
      this.isValidForm = false;
    }
  }

  initializeSelectionState() {
    if (this.filteredRoles.length > 0) {
      this.isAllSelected = false;
      this.isInitialLoad = true;
      this.selectedRoles = [];
      this.selectedRoleIds = [];
      this.selectedRoleIdsString = '';
    }
  }

  async getRoles() {
    try {
      let response = await this.userService.getRoles().toPromise();
      if (response) {
        this.roles = response.filter((role: any) => role.is_active === 1);
        this.roles.unshift({ id: '', role_name: 'All' });
        this.filteredRoles = this.roles;
        this.initializeSelectionState();
      }
    } catch (error) {
      this.roles = [];
    }
  }

  async getStaffs() {
    try {
      let response = await this.userService.getStaffs().toPromise();
      if (response) {
        this.staffs = response;
        this.staffs.unshift({ id: '', staff_name: 'Select Staff' });
      }
    } catch (error) {
      this.staffs = [];
      this.staffs.unshift({ id: '', staff_name: 'Select Staff' });
    }
  }

  closeModal() {
    this.activeModal.close();
  }

  toggleDropdown(event: MouseEvent) {
    event.stopPropagation();
    if ((event.target as HTMLElement).classList.contains('ms-1')) {
      return;
    }
    this.dropdownOpen = !this.dropdownOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (this.dropdownOpen) {
      this.dropdownOpen = false;
    }
  }

  onSearchInput() {
    if (!this.dropdownOpen) {
      this.dropdownOpen = true;
    }
    this.filterRoles();
  }

  filterRoles() {
    if (!this.searchTerm?.trim()) {
      this.filteredRoles = [...(this.roles || [])];
    } else {
      this.filteredRoles = (this.roles || []).filter((role: any) =>
        role?.role_name?.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  toggleSelection(role: any) {
    this.isInitialLoad = false;
    if (role.role_name === 'All') {
      if (!this.isAllSelected) {
        const nonAllRoles = this.filteredRoles.filter(
          (item) => item.role_name !== 'All'
        );
        this.selectedRoles = [...nonAllRoles];
        this.selectedRoleIds = nonAllRoles
          .map((item) => item.id)
          .filter((id) => id !== '');
        this.isAllSelected = true;
      } else {
        this.selectedRoles = [];
        this.selectedRoleIds = [];
        this.isAllSelected = false;
      }
    } else {
      const index = this.selectedRoles.findIndex((item) => item.id === role.id);

      if (this.isAllSelected) {
        const nonAllRoles = this.filteredRoles.filter(
          (item) => item.role_name !== 'All'
        );
        this.selectedRoles = nonAllRoles.filter((item) => item.id !== role.id);
        this.selectedRoleIds = this.selectedRoles
          .map((item) => item.id)
          .filter((id) => id !== '');
        this.isAllSelected = false;
      } else {
        if (index === -1) {
          this.selectedRoles.push(role);
          if (role.id !== '') {
            this.selectedRoleIds.push(role.id);
          }
        } else {
          this.selectedRoles.splice(index, 1);
          this.selectedRoleIds = this.selectedRoleIds.filter(
            (id) => id !== role.id
          );
        }
        const nonAllRoles = this.filteredRoles.filter(
          (item) => item.role_name !== 'All'
        );
        if (this.selectedRoles.length === nonAllRoles.length) {
          this.isAllSelected = true;
        }
      }
    }

    this.selectedRoleIdsString = this.selectedRoleIds.join(',');
    this.searchTerm = '';
    this.filterRoles();
    this.addUserForm.controls['roles'].setValue(
      this.isAllSelected ? 'All' : this.selectedRoles
    );
  }

  clearAllSelections(event: Event) {
    event.stopPropagation();
    this.isInitialLoad = false;
    this.isAllSelected = false;
    this.selectedRoles = [];
    this.selectedRoleIds = [];
    this.selectedRoleIdsString = '';
    this.filterRoles();
  }

  isSelected(role: any): boolean {
    if (!role) return false;

    if (role.role_name === 'All') {
      return this.isAllSelected;
    }

    return this.selectedRoles.some((item) => item?.id === role?.id);
  }

  getDisplayItems(): any[] {
    if (!this.filteredRoles || this.filteredRoles.length === 0) {
      return [];
    }

    if (this.isInitialLoad || this.selectedRoles.length === 0) {
      return [];
    }

    if (this.selectedRoleIds.length === 0) {
      return [];
    }

    if (this.isAllSelected) {
      const allOption = this.filteredRoles.find(
        (item) => item?.role_name === 'All'
      );
      return allOption ? [allOption] : [];
    }

    return this.selectedRoles.length > 0 ? this.selectedRoles : [];
  }

  shouldShowClearAll(): boolean {
    return this.selectedRoles.length > 0;
  }

  removeSelected(selected: any) {
    if (this.isInitialLoad) {
      this.isInitialLoad = false;
      this.isAllSelected = false;
      this.selectedRoles = [];
      this.selectedRoleIds = [];
      this.selectedRoleIdsString = '';
    } else {
      if (selected.role_name === 'All') {
        this.isAllSelected = false;
        this.selectedRoles = [];
        this.selectedRoleIds = [];
        this.selectedRoleIdsString = '';
      } else {
        this.toggleSelection(selected);
      }
    }
    this.filterRoles();
  }
}
