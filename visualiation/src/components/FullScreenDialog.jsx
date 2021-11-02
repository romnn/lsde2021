

// const Transition = React.forwardRef(function Transition(props, ref) {
//     return <Slide direction="up" ref={ref} {...props} />;
// });
// export default function FullScreenDialog(props) {
//     if (props.event){
//         console.log("event",  props.event.x)
//     }
   
//   return (
//     <div>
//      <Dialog
//         fullScreen
//         open={props.open}
//         onClose={props.handleClose}
//         TransitionComponent={Transition}
//         class="bg-grey-300"
//       >
//         <AppBar sx={{ position: 'relative' }}>
//           <Toolbar class="text-center px-2 text-4xl">
//           {/* Use Event Dictionary here, to get the evnet title from event date */}
//        

//             <IconButton
//               edge="end"
//               color="inherit"
//               onClick={props.handleClose}
//               aria-label="close"
//             >
//               <CloseIcon />

              
//             </IconButton>
           
          

//           </Toolbar>
//         </AppBar>

    


//         </div>
       
//       </Dialog>
//     </div>
//   );
// }