import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-cn-updation',
  standalone: false,
  
  templateUrl: './cn-updation.component.html',
  styleUrl: './cn-updation.component.scss'
})
export class CnUpdationComponent {

    uploadDocForm!: FormGroup;
fileTypes: string[] = ['Credit Summary', 'Ledger File', 'Credit Note PDF File', 'Invoice Summary', 'Invoice PDF', 'Credit Note Working File', 'Monthly Transaction'];
    statuses: any[] = [{ "id": "", "name": "All" }, { "id": "Pending", "name": "Pending" }, { "id": "Completed", "name": "Completed" }, { "id": "Failed", "name": "Failed" }, { "id": "Partilly-Completed", "name": "Partilly-Completed" }]
    selectedFiles: any = [];
     isValidForm!: boolean;
    constructor(private formBuilder: FormBuilder,){

    }

    ngOnInit(): void {
      this.isValidForm = true;
       this.uploadDocForm = this.formBuilder.group({
            selectedFile: ['', [Validators.required]],
            fileType: ['', [Validators.required]]
        });
    }

     onFileTypeChange(fileType: string) {
        this.uploadDocForm.get("selectedFile")?.setValue("") // Reset the selected file input
        this.selectedFiles = [] // Clear the currently selected files array

        // Set 'selectedFile' as required and update its validity
        this.uploadDocForm.controls['selectedFile'].setValidators([Validators.required]);
        this.uploadDocForm.controls['selectedFile'].updateValueAndValidity();
    }

     checkFile(event: any) {
        // Check if any files are selected
        if (event.target.files.length > 0) {
            for (let keys in event.target.files) {
                // Loop through selected files and add them to the `selectedFiles` array
                // this.selectedFiles.push(event.target.files[keys])
                let value = event.target.files[keys]
                if (value instanceof File) {
                    this.selectedFiles.push(value); // Add the file to the selectedFiles array
                }
            }
        }
        else {
            // Reset the "selectedFile" form control if no files are selected
            this.uploadDocForm.get("selectedFile")?.setValue("");
        }
    }

}
