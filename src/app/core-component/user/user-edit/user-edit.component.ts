import { Component, HostListener, Input } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UserService } from 'src/app/core/service/user/user.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-user-edit',
  standalone: false,
  templateUrl: './user-edit.component.html',
  styleUrl: './user-edit.component.scss',
})
export class UserEditComponent {
  @Input() modalParams: any;
  editUserForm!: FormGroup;
  alphaWithWithSpace = '^[A-Za-z]+([ ]?[A-Za-z])*$';
  emailpattern =
    /^[a-zA-Z][a-zA-Z0-9._%+-]+@[a-zA-Z][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  mobilePattern = '^(?!0{10}$)[0-9]{10}$';
  isValidForm!: boolean;
  roles: any = [];
  user: any;
  staffs: any = [];
  filteredRoles: any[] = [];
  selectedRoles: any[] = [];
  selectedRoleIds: number[] = [];
  selectedRoleIdsString: string = '';
  searchTerm: string = '';
  dropdownOpen: boolean = false;
  isAllSelected: boolean = false;
  userData: any = [];
  
  // Password visibility toggle
  showPassword: boolean = false;

  constructor(
    private activeModal: NgbActiveModal,
    private formBuilder: FormBuilder,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.isValidForm = true;
    this.dropdownOpen = false; // Ensure dropdown starts closed
    this.editUserForm = this.formBuilder.group({
      roles: [null, Validators.required],
      staff: this.formBuilder.group({
        id: ['', Validators.required],
      }),
      password: ['', [Validators.minLength(8)]], // Removed required validator
    });
    this.getRoles();
    this.getStaffs();
    this.getUserById(this.modalParams?.user);
  }

  // Toggle password visibility
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
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

  async getRoles() {
    try {
      let response = await this.userService.getRoles().toPromise();
      if (response) {
        this.roles = response.filter((role: any) => role.is_active === 1);
        this.roles.unshift({ id: '', role_name: 'All' });
        this.filteredRoles = this.roles;
        
        // If user data is already loaded, auto-select the role
        if (this.userData && this.userData.length > 0) {
          this.initializeSelectionFromUserData();
          // Update the form control with the selected role
          if (this.selectedRoles.length > 0) {
            this.editUserForm.controls['roles'].setValue(this.selectedRoles);
          }
        }
      }
    } catch (error) {
      this.roles = [];
      this.roles.unshift({ id: '', role_name: 'Select Role' });
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

  async getUserById(id: any) {
    let response = await this.userService.getUser(id).toPromise();
    if (response) {
      this.userData = response;
      const [patchValue] = response;
      this.editUserForm.patchValue({
        staff: {
          id: patchValue.mapped_staff_id,
        },
      });
      
      // Auto-select the user's current role
      if (this.roles && this.roles.length > 0) {
        this.initializeSelectionFromUserData();
        // Update the form control with the selected role
        if (this.selectedRoles.length > 0) {
          this.editUserForm.controls['roles'].setValue(this.selectedRoles);
        }
      }
    }
  }

  async updateUser() {
    if (this.editUserForm.valid) {
      try {
        this.isValidForm = true;
        const password = this.editUserForm.get('password')?.value;
        const payload: any = {
          staff_id: this.editUserForm.get('staff.id')?.value,
          role_ids: this.selectedRoleIds,
        };
        
        // Only include password if it's provided and not empty
        if (password && password.trim() !== '') {
          payload.password = password;
        }
        
        let response = await this.userService
          .updateUser(payload, this.modalParams?.user)
          .toPromise();
        if (
          response.status_code == 200 &&
          response.message == 'User updated successfully'
        ) {
          this.showNotification(
            'Success',
            'User updated successfully',
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

  closeModal() {
    this.activeModal.close();
  }

  initializeSelectionState() {
    this.isAllSelected = false;
    this.selectedRoles = [];
    this.selectedRoleIds = [];
    this.selectedRoleIdsString = '';
  }

  initializeSelectionStateForEdit(userData: any) {
    if (userData && userData.role_name) {
      const matchingRole = this.roles.find(
        (role: any) =>
          role.role_name === this.userData.role_name && role.id !== ''
      );

      if (matchingRole) {
        this.selectedRoles = [matchingRole];
        this.selectedRoleIds = [matchingRole.id];
        this.selectedRoleIdsString = matchingRole.id.toString();
        this.isAllSelected = false;
      } else {
        this.initializeSelectionState();
      }
    } else {
      this.initializeSelectionState();
    }
  }
  initializeSelectionFromUserData() {
    if (this.userData && this.userData.length > 0) {
      const userRole = this.userData[0];

      if (userRole.role_name) {
        const matchingRole = this.roles.find(
          (role: any) => role.role_name === userRole.role_name && role.id !== ''
        );

        if (matchingRole) {
          this.selectedRoles = [matchingRole];
          this.selectedRoleIds = [matchingRole.id];
          this.selectedRoleIdsString = matchingRole.id.toString();
          this.isAllSelected = false;
        } else {
          this.initializeEmptySelection();
        }
      } else {
        this.initializeEmptySelection();
      }
    } else {
      this.initializeEmptySelection();
    }
  }

  initializeEmptySelection() {
    this.isAllSelected = false;
    this.selectedRoles = [];
    this.selectedRoleIds = [];
    this.selectedRoleIdsString = '';
  }

  toggleDropdown(event: MouseEvent) {
    event.stopPropagation();
    if ((event.target as HTMLElement).classList.contains('ms-1')) {
      return;
    }
    
    // Toggle dropdown state
    this.dropdownOpen = !this.dropdownOpen;
    
    // If opening dropdown, ensure roles are filtered
    if (this.dropdownOpen) {
      this.filterRoles();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (this.dropdownOpen) {
      this.dropdownOpen = false;
    }
  }

  onSearchInput() {
    // Don't automatically open dropdown on search input
    // Only filter the roles
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
    this.editUserForm.controls['roles'].setValue(
      this.isAllSelected ? 'All' : this.selectedRoles
    );
  }

  clearAllSelections(event: Event) {
    event.stopPropagation();
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
    if (selected.role_name === 'All') {
      this.isAllSelected = false;
      this.selectedRoles = [];
      this.selectedRoleIds = [];
      this.selectedRoleIdsString = '';
    } else {
      this.toggleSelection(selected);
    }
    this.filterRoles();
  }

  resetSelections() {
    this.initializeEmptySelection();
    this.filterRoles();
  }

  getSelectedRoleData() {
    return {
      selectedRoleIds: this.selectedRoleIds,
      selectedRoleIdsString: this.selectedRoleIdsString,
      selectedRoles: this.selectedRoles,
      isAllSelected: this.isAllSelected,
    };
  }
}
