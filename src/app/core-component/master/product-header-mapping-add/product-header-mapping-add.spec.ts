import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductHeaderMappingAdd } from './product-header-mapping-add';

describe('ProductHeaderMappingAdd', () => {
  let component: ProductHeaderMappingAdd;
  let fixture: ComponentFixture<ProductHeaderMappingAdd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProductHeaderMappingAdd]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductHeaderMappingAdd);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
