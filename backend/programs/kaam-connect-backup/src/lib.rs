use anchor_lang::prelude::*;

declare_id!("HbmvzJKLNfJe5wVDhuFXbncAX9RGAg5x8owjvyuwdV3d");

#[program]
pub mod kaam_connect {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
