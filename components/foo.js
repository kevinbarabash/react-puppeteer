import * as React from "react";
import {StyleSheet, css} from "aphrodite";

export default class Foo extends React.Component {
    render() {
        return <h1 className={css(styles.title)}>
            Hello, world
        </h1>;
    }
}

const styles = StyleSheet.create({
    title: {
      fontSize: 64,
    },
});
