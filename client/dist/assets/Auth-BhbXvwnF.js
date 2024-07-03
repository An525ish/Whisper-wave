import{j as e,u as v,p as j,b as E,_ as d,r as N}from"./main-Dgb4rnFp.js";import{a as h}from"./avatar-rfQuAypq.js";import{u as f,I as c,a as b,b as x,c as D,v as g}from"./validators-BQQ21ygL.js";const w=({setIsForget:t})=>{const{register:s,handleSubmit:r,formState:{errors:n}}=f({mode:"onChange"}),a=async i=>{try{console.log(i)}catch(o){console.error("Error registering user:",o)}};return e.jsxDEV("div",{className:"w-full",children:[e.jsxDEV("img",{src:h,alt:"",className:"h-[10rem] w-[10rem] mx-auto border-4 rounded-full p-4 shadow-lg"},void 0,!1,{fileName:"D:/Essentials/Doc/Projects/MERN/Whisper wave/client/src/components/auth/ForgotPassword.jsx",lineNumber:27,columnNumber:13},void 0),e.jsxDEV("form",{onSubmit:r(a),className:"flex flex-col gap-4 items-center w-4/5 lg:w-3/5 mx-auto my-8",children:[e.jsxDEV(c,{type:"email",name:"email",placeholder:"Email",register:s,validate:b,errors:n},void 0,!1,{fileName:"D:/Essentials/Doc/Projects/MERN/Whisper wave/client/src/components/auth/ForgotPassword.jsx",lineNumber:30,columnNumber:17},void 0),e.jsxDEV("button",{className:"px-4 py-2 rounded-3xl w-full outline-none bg-gradient-action-button-green mt-4 hover:scale-95 ease-linear",children:"Submit"},void 0,!1,{fileName:"D:/Essentials/Doc/Projects/MERN/Whisper wave/client/src/components/auth/ForgotPassword.jsx",lineNumber:39,columnNumber:17},void 0),!1,e.jsxDEV("p",{className:"text-base w-full mt-4 text-blue cursor-pointer",onClick:()=>t(!1),children:[e.jsxDEV("span",{className:"mr-2",children:"⟨"},void 0,!1,{fileName:"D:/Essentials/Doc/Projects/MERN/Whisper wave/client/src/components/auth/ForgotPassword.jsx",lineNumber:46,columnNumber:21},void 0),"  Back to Login"]},void 0,!0,{fileName:"D:/Essentials/Doc/Projects/MERN/Whisper wave/client/src/components/auth/ForgotPassword.jsx",lineNumber:43,columnNumber:17},void 0)]},void 0,!0,{fileName:"D:/Essentials/Doc/Projects/MERN/Whisper wave/client/src/components/auth/ForgotPassword.jsx",lineNumber:29,columnNumber:13},void 0)]},void 0,!0,{fileName:"D:/Essentials/Doc/Projects/MERN/Whisper wave/client/src/components/auth/ForgotPassword.jsx",lineNumber:26,columnNumber:9},void 0)},R=w,P=({setIsLogin:t,setIsForget:s})=>{const r=v(),{register:n,handleSubmit:a,formState:{errors:i}}=f({mode:"onChange",defaultValues:{username:"Cleveland6",password:"password123"}}),o=async u=>{try{const l=await j("/auth/signIn",u);r(E(l.data)),d.success(l.message)}catch(l){d.error((l==null?void 0:l.message)||"Something went wrong")}};return e.jsxDEV("div",{className:"w-full",children:[e.jsxDEV("img",{src:h,alt:"",className:"h-[10rem] w-[10rem] mx-auto border-4 rounded-full p-4 shadow-lg"},void 0,!1,{fileName:"D:/Essentials/Doc/Projects/MERN/Whisper wave/client/src/components/auth/Login.jsx",lineNumber:35,columnNumber:13},void 0),e.jsxDEV("form",{onSubmit:a(o),className:"flex flex-col gap-4 items-center w-4/5 lg:w-3/5 mx-auto my-8",children:[e.jsxDEV(c,{type:"text",name:"username",placeholder:"Username",register:n,errors:i},void 0,!1,{fileName:"D:/Essentials/Doc/Projects/MERN/Whisper wave/client/src/components/auth/Login.jsx",lineNumber:38,columnNumber:17},void 0),e.jsxDEV(c,{type:"password",name:"password",placeholder:"Password",register:n,errors:i},void 0,!1,{fileName:"D:/Essentials/Doc/Projects/MERN/Whisper wave/client/src/components/auth/Login.jsx",lineNumber:46,columnNumber:17},void 0),e.jsxDEV("button",{className:"px-4 py-2 rounded-3xl w-full outline-none bg-gradient-action-button-green mt-4 hover:scale-95 ease-linear",children:"Login"},void 0,!1,{fileName:"D:/Essentials/Doc/Projects/MERN/Whisper wave/client/src/components/auth/Login.jsx",lineNumber:54,columnNumber:17},void 0),e.jsxDEV("p",{className:"text-xs w-full italic text-right hover:text-blue cursor-pointer",onClick:()=>s(!0),children:"Forget your Password ?"},void 0,!1,{fileName:"D:/Essentials/Doc/Projects/MERN/Whisper wave/client/src/components/auth/Login.jsx",lineNumber:56,columnNumber:17},void 0),e.jsxDEV("p",{className:"text-base w-full mt-4",children:["Don’t have an account ? ",e.jsxDEV("span",{className:" text-green cursor-pointer",onClick:()=>t(!1),children:"Sign Up"},void 0,!1,{fileName:"D:/Essentials/Doc/Projects/MERN/Whisper wave/client/src/components/auth/Login.jsx",lineNumber:59,columnNumber:78},void 0)]},void 0,!0,{fileName:"D:/Essentials/Doc/Projects/MERN/Whisper wave/client/src/components/auth/Login.jsx",lineNumber:59,columnNumber:17},void 0)]},void 0,!0,{fileName:"D:/Essentials/Doc/Projects/MERN/Whisper wave/client/src/components/auth/Login.jsx",lineNumber:37,columnNumber:13},void 0)]},void 0,!0,{fileName:"D:/Essentials/Doc/Projects/MERN/Whisper wave/client/src/components/auth/Login.jsx",lineNumber:34,columnNumber:9},void 0)},V=P,W=({setFile:t})=>{const[s,r]=N.useState(h),n=a=>{const i=a.target.files[0];t(i);const o=new FileReader;o.onloadend=()=>{r(o.result)},o.readAsDataURL(i)};return e.jsxDEV("div",{className:"flex justify-center",children:[e.jsxDEV("label",{htmlFor:"avatar",className:"relative",children:e.jsxDEV("figure",{className:"relative w-28 h-28",children:[e.jsxDEV("img",{src:s,alt:"avatar",className:"w-28 h-28 object-cover rounded-full border-2 border-blue shadow-lg cursor-pointer transition-all duration-300 hover:shadow-md"},void 0,!1,{fileName:"D:/Essentials/Doc/Projects/MERN/Whisper wave/client/src/components/ui/AvatarInput.jsx",lineNumber:21,columnNumber:21},void 0),e.jsxDEV("figcaption",{className:"absolute top-0 left-0 w-full h-full rounded-full bg-black bg-opacity-0 flex items-center justify-center opacity-0 transition-all duration-300 hover:opacity-100 hover:bg-opacity-50 cursor-pointer",children:e.jsxDEV("img",{src:"https://raw.githubusercontent.com/ThiagoLuizNunes/angular-boilerplate/master/src/assets/imgs/camera-white.png",className:"w-12 h-12"},void 0,!1,{fileName:"D:/Essentials/Doc/Projects/MERN/Whisper wave/client/src/components/ui/AvatarInput.jsx",lineNumber:23,columnNumber:25},void 0)},void 0,!1,{fileName:"D:/Essentials/Doc/Projects/MERN/Whisper wave/client/src/components/ui/AvatarInput.jsx",lineNumber:22,columnNumber:21},void 0),e.jsxDEV("span",{className:"absolute bottom-3 right-0 w-6 h-6 flex justify-center items-center bg-primary rounded-full cursor-pointer",children:"📷"},void 0,!1,{fileName:"D:/Essentials/Doc/Projects/MERN/Whisper wave/client/src/components/ui/AvatarInput.jsx",lineNumber:25,columnNumber:21},void 0)]},void 0,!0,{fileName:"D:/Essentials/Doc/Projects/MERN/Whisper wave/client/src/components/ui/AvatarInput.jsx",lineNumber:20,columnNumber:17},void 0)},void 0,!1,{fileName:"D:/Essentials/Doc/Projects/MERN/Whisper wave/client/src/components/ui/AvatarInput.jsx",lineNumber:19,columnNumber:13},void 0),e.jsxDEV("input",{type:"file",onChange:n,id:"avatar",accept:"image/*",className:"hidden"},void 0,!1,{fileName:"D:/Essentials/Doc/Projects/MERN/Whisper wave/client/src/components/ui/AvatarInput.jsx",lineNumber:28,columnNumber:13},void 0)]},void 0,!0,{fileName:"D:/Essentials/Doc/Projects/MERN/Whisper wave/client/src/components/ui/AvatarInput.jsx",lineNumber:18,columnNumber:9},void 0)},M=({setIsLogin:t})=>{const[s,r]=N.useState(null),n=v(),{register:a,handleSubmit:i,watch:o,formState:{errors:u}}=f({mode:"onChange"}),l=async p=>{try{const m=await j("/auth/signUp",{avatar:s,...p},{"Content-Type":"multipart/form-data"});d.success(m.message),n(E(m.data))}catch(m){d.error((m==null?void 0:m.message)||"Something went wrong")}};return e.jsxDEV("div",{className:"w-full",children:[e.jsxDEV("div",{className:"flex justify-center",children:e.jsxDEV(W,{file:s,setFile:r},void 0,!1,{fileName:"D:/Essentials/Doc/Projects/MERN/Whisper wave/client/src/components/auth/Register.jsx",lineNumber:35,columnNumber:17},void 0)},void 0,!1,{fileName:"D:/Essentials/Doc/Projects/MERN/Whisper wave/client/src/components/auth/Register.jsx",lineNumber:34,columnNumber:13},void 0),e.jsxDEV("form",{onSubmit:i(l),className:"flex flex-col gap-4 items-center w-4/5 lg:w-3/5 mx-auto my-8",children:[e.jsxDEV(c,{type:"text",name:"name",placeholder:"Fullname",register:a,validate:x,errors:u},void 0,!1,{fileName:"D:/Essentials/Doc/Projects/MERN/Whisper wave/client/src/components/auth/Register.jsx",lineNumber:42,columnNumber:17},void 0),e.jsxDEV(c,{type:"text",name:"username",placeholder:"username",register:a,validate:D,errors:u},void 0,!1,{fileName:"D:/Essentials/Doc/Projects/MERN/Whisper wave/client/src/components/auth/Register.jsx",lineNumber:50,columnNumber:17},void 0),e.jsxDEV(c,{type:"password",name:"password",placeholder:"Password",register:a,validate:g,errors:u},void 0,!1,{fileName:"D:/Essentials/Doc/Projects/MERN/Whisper wave/client/src/components/auth/Register.jsx",lineNumber:58,columnNumber:17},void 0),e.jsxDEV(c,{type:"password",name:"confirmPassword",placeholder:"Confirm Password",register:a,validate:p=>p===o("password")||"Passwords do not match",errors:u},void 0,!1,{fileName:"D:/Essentials/Doc/Projects/MERN/Whisper wave/client/src/components/auth/Register.jsx",lineNumber:66,columnNumber:17},void 0),e.jsxDEV("button",{className:"px-4 py-2 rounded-3xl w-full outline-none bg-gradient-action-button-green mt-4 hover:scale-95 ease-linear",children:"Register"},void 0,!1,{fileName:"D:/Essentials/Doc/Projects/MERN/Whisper wave/client/src/components/auth/Register.jsx",lineNumber:77,columnNumber:17},void 0),e.jsxDEV("p",{className:"text-base w-full mt-4",children:["Already have an account ? ",e.jsxDEV("span",{className:" text-green cursor-pointer",onClick:()=>t(!0),children:"Sign In"},void 0,!1,{fileName:"D:/Essentials/Doc/Projects/MERN/Whisper wave/client/src/components/auth/Register.jsx",lineNumber:79,columnNumber:80},void 0)]},void 0,!0,{fileName:"D:/Essentials/Doc/Projects/MERN/Whisper wave/client/src/components/auth/Register.jsx",lineNumber:79,columnNumber:17},void 0)]},void 0,!0,{fileName:"D:/Essentials/Doc/Projects/MERN/Whisper wave/client/src/components/auth/Register.jsx",lineNumber:41,columnNumber:13},void 0)]},void 0,!0,{fileName:"D:/Essentials/Doc/Projects/MERN/Whisper wave/client/src/components/auth/Register.jsx",lineNumber:33,columnNumber:9},void 0)},y=M;function L(){const[t,s]=N.useState(!0),[r,n]=N.useState(!1);return e.jsxDEV("div",{className:"h-[100vh]",children:e.jsxDEV("div",{className:"flex items-center h-full text-center justify-center py-10",children:[e.jsxDEV("div",{className:"flex-[1] grid place-items-center h-full",children:r?e.jsxDEV(R,{setIsForget:n},void 0,!1,{fileName:"D:/Essentials/Doc/Projects/MERN/Whisper wave/client/src/pages/Auth.jsx",lineNumber:17,columnNumber:29},this):t?e.jsxDEV(V,{setIsLogin:s,setIsForget:n},void 0,!1,{fileName:"D:/Essentials/Doc/Projects/MERN/Whisper wave/client/src/pages/Auth.jsx",lineNumber:18,columnNumber:39},this):e.jsxDEV(y,{setIsLogin:s},void 0,!1,{fileName:"D:/Essentials/Doc/Projects/MERN/Whisper wave/client/src/pages/Auth.jsx",lineNumber:21,columnNumber:34},this)},void 0,!1,{fileName:"D:/Essentials/Doc/Projects/MERN/Whisper wave/client/src/pages/Auth.jsx",lineNumber:14,columnNumber:17},this),e.jsxDEV("div",{className:"hidden md:block h-full w-[1px] bg-border rotate-180"},void 0,!1,{fileName:"D:/Essentials/Doc/Projects/MERN/Whisper wave/client/src/pages/Auth.jsx",lineNumber:26,columnNumber:17},this),e.jsxDEV("div",{className:"md:flex-[1] lg:flex-[2] md:block hidden font-bold text-[4rem] lg:text-[5rem]",children:t?"Welcome Back":"New Here ?"},void 0,!1,{fileName:"D:/Essentials/Doc/Projects/MERN/Whisper wave/client/src/pages/Auth.jsx",lineNumber:27,columnNumber:17},this)]},void 0,!0,{fileName:"D:/Essentials/Doc/Projects/MERN/Whisper wave/client/src/pages/Auth.jsx",lineNumber:13,columnNumber:13},this)},void 0,!1,{fileName:"D:/Essentials/Doc/Projects/MERN/Whisper wave/client/src/pages/Auth.jsx",lineNumber:12,columnNumber:9},this)}export{L as default};