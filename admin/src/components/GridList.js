import * as React from "react";
// import MuiGridList from '@mui/material/GridList';
import { ImageListItem } from "@mui/material";
// import GridListTile from '@mui/material/GridListTile';
// import GridListTileBar from '@mui/material/GridListTileBar';
import { makeStyles } from "@mui/styles";
// import withWidth, { WithWidth } from '@mui/material/withWidth';
import API from "@/functions/API";

import { useListContext,useNotify } from "react-admin";
import { ShopURL } from "@/functions/API";
import { Button } from "@mui/material";
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
const useStyles = makeStyles(theme => ({
  gridList: {
    margin: 0
  },
  tileBar: {
    background:
      "linear-gradient(to top, rgba(0,0,0,0.8) 0%,rgba(0,0,0,0.4) 70%,rgba(0,0,0,0) 100%)"
  },
  placeholder: {
    backgroundColor: theme.palette.grey[300],
    height: "100%"
  },
  price: {
    display: "inline",
    fontSize: "1em"
  },
  link: {
    color: "#fff"
  }
}));

const getColsForWidth = (width) => {
  if (width === "xs") return 2;
  if (width === "sm") return 3;
  if (width === "md") return 3;
  if (width === "lg") return 5;
  return 6;
};

const times = (nbChildren, fn) =>
  Array.from({ length: nbChildren }, (_, key) => fn(key));

const LoadingGridList = (props) => {
  const { width, nbItems = 20 } = props;
  const classes = useStyles();
  return times(nbItems, key => (
    <ImageListItem key={key} className={"media_ImageListItem notLoaded"}>
      <div className={classes.placeholder}/>
    </ImageListItem>));
};

const LoadedGridList = (props) => {
  const { width } = props;
  const { data } = useListContext();
  const classes = useStyles();
    const notify = useNotify();

    console.log("LoadedGridList", data);

  // if (!ids || !data) return null;
const delete_media=(e,_id)=>{
  console.log("_id",_id)
    API.delete("/media/" + _id)
        .then(({ data = {} }) => {
            notify("deleted!");

        })
        .catch((err) => {
            console.log("error", err);
        });
}
  return data.map((d, key) => {
    return (
      <ImageListItem key={key} className={"media_ImageListItem"}>
        <img
          src={ShopURL + d.url}
          srcSet={ShopURL + d.url}
          loading="lazy"
        />
        <Button className={'delete-media'} onClick={(e)=>delete_media(e,d._id)}><DeleteOutlineIcon/></Button>
      </ImageListItem>

    );
  });
};


const GridList = (props) => {
  const { width } = props;
  const { data,isLoading } = useListContext();
  let loaded = Boolean(data && data.length);
  console.log("loaded", loaded,isLoading);
  return loaded ? (
    <LoadedGridList width={width}/>
  ) : (
    <LoadingGridList width={width}/>
  );
};

export default GridList;
