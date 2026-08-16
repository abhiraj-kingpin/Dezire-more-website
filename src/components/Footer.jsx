import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

function Footer() {
  const { t } = useLanguage();
  return (
    <footer>
      <div className="footer-grid">
        <div className="footer-brand">
          <h3>Dezire More</h3>
          <p className="tagline">{t('footer_tagline')}</p>
          <p>{t('footer_about')}</p>
        </div>

        <div className="footer-col">
          <h4>{t('footer_help')}</h4>
          <ul>
            <li><Link to="/faq">{t('footer_faq')}</Link></li>
            <li><Link to="/size-guide">{t('footer_sizeGuide')}</Link></li>
            <li><Link to="/shipping-policy">{t('footer_shippingPolicy')}</Link></li>
            <li><Link to="/contact">{t('footer_contactUs')}</Link></li>
            <li><Link to="/privacy-policy">{t('footer_privacyPolicy')}</Link></li>
            <li><Link to="/terms-conditions">{t('footer_termsConditions')}</Link></li>
            <li>
              <a href="https://wa.me/918171761948" target="_blank" rel="noreferrer">
                {t('footer_trackWhatsapp')}
              </a>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>{t('footer_contact')}</h4>
          <ul>
            <li><a href="mailto:hello@deziremore.in">hello@deziremore.in</a></li>
            <li><a href="tel:+918171761948">+91 81717 61948</a></li>
            <li><a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a></li>
            <li><a href="https://facebook.com" target="_blank" rel="noreferrer">Facebook</a></li>
            <li><a href="https://wa.me/918171761948" target="_blank" rel="noreferrer">WhatsApp</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 Dezire More. {t('footer_rights')}</p>
        <p>{t('footer_tagline')} ◆</p>
      </div>
    </footer>
  );
}

export default Footer;
