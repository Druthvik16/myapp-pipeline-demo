import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarkModalComponent } from './mark-modal.component';

describe('MarkModalComponent', () => {
  let component: MarkModalComponent;
  let fixture: ComponentFixture<MarkModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MarkModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarkModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
