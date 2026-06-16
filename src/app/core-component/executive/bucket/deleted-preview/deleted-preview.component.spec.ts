import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeletedPreviewComponent } from './deleted-preview.component';

describe('DeletedPreviewComponent', () => {
  let component: DeletedPreviewComponent;
  let fixture: ComponentFixture<DeletedPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DeletedPreviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeletedPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
