import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Footer.css';

const Footer: React.FC = () => {
  const navigate = useNavigate();
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
            <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/user-agreement'); }}>Пользовательское соглашение</a></li>
            <li><a href="#privacy">Политика конфиденциальности</a></li>
            <li><a href="#disclaimer">Отказ от ответственности</a></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4>Контактная информация</h4>
          <div className="footer-contact">
            <p><strong>ИП Филяев</strong></p>
            <p>Телефон: <a href="tel:+79955999393">+7 (995) 599-93-93</a></p>
            <p>Адрес: г. Липецк, ул. Циолковского, д. 6</p>
            <p>ИНН: 482619918391</p>
          </div>
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
