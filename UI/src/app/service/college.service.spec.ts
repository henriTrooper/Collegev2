import { TestBed } from '@angular/core/testing';

import { CollegeService } from './college.service';

describe('EolienService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: CollegeService = TestBed.get(CollegeService);
    expect(service).toBeTruthy();
  });
});
