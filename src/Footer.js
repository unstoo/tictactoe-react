import React from 'react'
import logo from './rs_logo.svg';
import './App.css';

const Footer = () => {



    return (
      <footer className="footer">
        <div>
          <a href="https://github.com/unstoo" target="__blank">
            Github
          </a>
        </div>
        <div>
          2021
        </div>
        <div className="logo">
        <img src={logo} alt="Rolling Scopes School Logo" />
        </div>
        <div>
          <a href="https://rs.school/react/" target="__blank">
            Project task
          </a>
        </div>
      </footer>
    )
      
}

export default Footer;
