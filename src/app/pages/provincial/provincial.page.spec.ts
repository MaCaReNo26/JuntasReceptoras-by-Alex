import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProvincialPage } from './provincial.page';

describe('ProvincialPage', () => {
  let component: ProvincialPage;
  let fixture: ComponentFixture<ProvincialPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ProvincialPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
