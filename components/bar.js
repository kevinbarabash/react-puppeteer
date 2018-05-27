import * as React from "react";
import {StyleSheet, css} from "aphrodite";

export default class Bar extends React.Component {
    render() {
        return <p className={css(styles.title)}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam 
            finibus dignissim neque a tempor. Suspendisse ut nulla sit amet 
            nisl condimentum laoreet nec scelerisque libero. In sit amet 
            iaculis metus.
        </p>;
    }
}

const styles = StyleSheet.create({
    title: {
      fontSize: 24,
    },
});
