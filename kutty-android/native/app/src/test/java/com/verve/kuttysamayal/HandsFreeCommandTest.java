package com.verve.kuttysamayal;
import org.junit.Test;
import static org.junit.Assert.*;
public class HandsFreeCommandTest {
 @Test public void stopIsAnExactControlCommand(){
  assertTrue(HandsFreeService.stopCommand("Stop."));assertTrue(HandsFreeService.stopCommand("Hey Kutty stop"));assertTrue(HandsFreeService.stopCommand("stop listening"));
  assertFalse(HandsFreeService.stopCommand("Should I stop cooking the rice?"));assertFalse(HandsFreeService.stopCommand("Do not stop"));
  assertEquals(3600000L,HandsFreeService.DURATION);
 }
}
