import React from 'react';
import {createRoot} from 'react-dom/client';
import './native';
import App from './App';
import './styles.css';
class Boundary extends React.Component<{children:React.ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true}}render(){return this.state.failed?<main style={{padding:24}}><h1>Let’s reopen your kitchen</h1><p>Your saved dishes are still on this phone.</p><button onClick={()=>location.reload()}>Try again</button></main>:this.props.children}}
createRoot(document.getElementById('root')!).render(<Boundary><App/></Boundary>);
