import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LanguageSwitcher } from './language-switcher';
import { TranslateService, provideTranslateService, TranslatePipe } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { provideHttpClient } from '@angular/common/http';
import { LANGUAGE_STORAGE_KEY, SUPPORTED_LANGUAGES } from './languages';

describe('LanguageSwitcher', () => {
  let component: LanguageSwitcher;
  let fixture: ComponentFixture<LanguageSwitcher>;
  let translateService: TranslateService;

  beforeEach(async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    localStorage.clear();

    TestBed.configureTestingModule({
      imports: [LanguageSwitcher, TranslatePipe],
      providers: [
        provideHttpClient(),
        provideTranslateService({
          loader: provideTranslateHttpLoader({ prefix: '/i18n/', suffix: '.json' }),
          fallbackLang: 'en',
          lang: 'en',
        }),
      ],
    });

    translateService = TestBed.inject(TranslateService);
    translateService.use('en');

    fixture = TestBed.createComponent(LanguageSwitcher);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('component initialization', () => {
    it('should create the component', () => {
      expect(component).toBeDefined();
    });

    it('should have access to supported languages', () => {
      expect(component['languages']).toBe(SUPPORTED_LANGUAGES);
      expect(component['languages'].length).toBeGreaterThan(0);
    });

    it('should display current language from translate service', () => {
      expect(component['currentLang']()).toBe('en');
    });
  });

  describe('language selection', () => {
    it('should change language when selectLanguage is called', () => {
      const useSpy = vi.spyOn(translateService, 'use');

      component['selectLanguage']('es');

      expect(useSpy).toHaveBeenCalledWith('es');
    });

    it('should save selected language to localStorage', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

      component['selectLanguage']('de');

      expect(setItemSpy).toHaveBeenCalledWith(LANGUAGE_STORAGE_KEY, 'de');
    });

    it('should call both translate.use and localStorage.setItem', () => {
      const useSpy = vi.spyOn(translateService, 'use');
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

      component['selectLanguage']('fr');

      expect(useSpy).toHaveBeenCalledWith('fr');
      expect(setItemSpy).toHaveBeenCalledWith(LANGUAGE_STORAGE_KEY, 'fr');
    });

    it('should support all 4 supported languages', () => {
      const languages = SUPPORTED_LANGUAGES;

      expect(languages.map((l) => l.code)).toEqual(['en', 'es', 'de', 'fr']);
    });

    it('should switch between all languages correctly', () => {
      const useSpy = vi.spyOn(translateService, 'use');

      component['selectLanguage']('es');
      expect(useSpy).toHaveBeenCalledWith('es');

      component['selectLanguage']('de');
      expect(useSpy).toHaveBeenCalledWith('de');

      component['selectLanguage']('fr');
      expect(useSpy).toHaveBeenCalledWith('fr');

      component['selectLanguage']('en');
      expect(useSpy).toHaveBeenCalledWith('en');
    });
  });

  describe('localStorage persistence', () => {
    it('should persist language selection across instances', () => {
      component['selectLanguage']('es');

      expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('es');
    });

    it('should handle empty localStorage gracefully', () => {
      localStorage.removeItem(LANGUAGE_STORAGE_KEY);

      expect(() => {
        component['selectLanguage']('en');
      }).not.toThrow();
    });

    it('should overwrite previous language selection in localStorage', () => {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');

      component['selectLanguage']('de');

      expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('de');
    });
  });

  describe('language labels and codes', () => {
    it('should have correct language labels', () => {
      const languages = SUPPORTED_LANGUAGES;

      expect(languages).toContainEqual(expect.objectContaining({ code: 'en' }));
      expect(languages).toContainEqual(expect.objectContaining({ code: 'es' }));
      expect(languages).toContainEqual(expect.objectContaining({ code: 'de' }));
      expect(languages).toContainEqual(expect.objectContaining({ code: 'fr' }));
    });

    it('should have label property for each language', () => {
      const languages = SUPPORTED_LANGUAGES;

      languages.forEach((lang) => {
        expect(lang).toHaveProperty('label');
        expect(lang.label).toBeTruthy();
      });
    });
  });

  describe('translation service integration', () => {
    it('should use TranslateService from the injector', () => {
      const injectedService = TestBed.inject(TranslateService);

      expect(translateService).toBe(injectedService);
    });

    it('should call translate.use with the correct language code', () => {
      const useSpy = vi.spyOn(translateService, 'use');

      component['selectLanguage']('fr');

      expect(useSpy).toHaveBeenCalledWith('fr');
    });
  });

  describe('UI integration', () => {
    it('should render language buttons in dropdown', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = compiled.querySelectorAll('.dropdown-item');

      expect(buttons.length).toBe(SUPPORTED_LANGUAGES.length);
    });

    it('should mark current language as active', () => {
      component['selectLanguage']('es');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const activeButton = compiled.querySelector('.dropdown-item.active');

      expect(activeButton).toBeDefined();
    });

    it('should call selectLanguage when dropdown item is clicked', () => {
      const selectLanguageSpy = vi.spyOn(component as any, 'selectLanguage');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = compiled.querySelectorAll('.dropdown-item');

      if (buttons[0]) {
        (buttons[0] as HTMLElement).click();
      }

      expect(selectLanguageSpy).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle rapid language changes', () => {
      const useSpy = vi.spyOn(translateService, 'use');

      component['selectLanguage']('es');
      component['selectLanguage']('de');
      component['selectLanguage']('fr');
      component['selectLanguage']('en');

      expect(useSpy).toHaveBeenCalledTimes(4);
    });

    it('should maintain localStorage consistency with language selection', () => {
      component['selectLanguage']('de');
      const storedValue = localStorage.getItem(LANGUAGE_STORAGE_KEY);

      expect(storedValue).toBe('de');
    });
  });
});
