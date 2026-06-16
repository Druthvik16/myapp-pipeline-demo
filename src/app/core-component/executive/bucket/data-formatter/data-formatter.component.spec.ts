import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataFormatterComponent } from './data-formatter.component';

describe('DataFormatterComponent', () => {
  let component: DataFormatterComponent;
  let fixture: ComponentFixture<DataFormatterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DataFormatterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DataFormatterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
