import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductHeaderMappingLists } from './product-header-mapping-lists';

describe('ProductHeaderMappingLists', () => {
  let component: ProductHeaderMappingLists;
  let fixture: ComponentFixture<ProductHeaderMappingLists>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProductHeaderMappingLists]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductHeaderMappingLists);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
