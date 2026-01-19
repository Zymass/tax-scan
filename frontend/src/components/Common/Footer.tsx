import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4>Налоговый калькулятор 2026</h4>
          <p>Расчет налоговой нагрузки для российского бизнеса</p>
        </div>
        
        <div className="footer-section">
          <h4>Информация</h4>
          <ul>
            <li><a href="#about">О проекте</a></li>
            <li><a href="#faq">FAQ</a></li>
            <li><a href="#contact">Контакты</a></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4>Правовая информация</h4>
          <ul>
            <li><a href="#privacy">Политика конфиденциальности</a></li>
            <li><a href="#terms">Условия использования</a></li>
            <li><a href="#disclaimer">Отказ от ответственности</a></li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {currentYear} Налоговый калькулятор 2026. Все права защищены.</p>
        <p className="footer-disclaimer">
          Данный калькулятор предоставляет приблизительные расчеты. 
          Для точных расчетов обратитесь к налоговому консультанту.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
