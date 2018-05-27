import {StyleSheet, css} from "aphrodite";

const styles = StyleSheet.create({
  wrapper: {
    background: "darkBlue",
    color: "white",
  },
});

<div className={css(styles.wrapper)}>
  <Foo/>
</div>