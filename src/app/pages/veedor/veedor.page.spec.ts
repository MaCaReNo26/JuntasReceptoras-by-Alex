import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VeedorPage } from './veedor.page';

describe('VeedorPage', () => {
  let component: VeedorPage;
  let fixture: ComponentFixture<VeedorPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(VeedorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
