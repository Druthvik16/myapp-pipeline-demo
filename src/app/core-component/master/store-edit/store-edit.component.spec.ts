import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoreEditComponent } from './store-edit.component';

describe('StoreEditComponent', () => {
  let component: StoreEditComponent;
  let fixture: ComponentFixture<StoreEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StoreEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StoreEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
