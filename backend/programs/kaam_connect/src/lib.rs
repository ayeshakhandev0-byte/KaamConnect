use anchor_lang::prelude::*;

// replace with your program ID
declare_id!("HbmvzJKLNfJe5wVDhuFXbncAX9RGAg5x8owjvyuwdV3d");

#[program]
pub mod kaam_connect {
    use super::*;

    // Existing RPC to create a task
    pub fn create_task(ctx: Context<CreateTask>, amount: u64) -> Result<()> {
        let task = &mut ctx.accounts.task_escrow;
        task.depositor = *ctx.accounts.depositor.key;
        task.recipient = *ctx.accounts.recipient.key;
        task.amount = amount;
        task.is_completed = false;
        Ok(())
    }

    // Existing RPC to complete a task
    pub fn complete_task(ctx: Context<CompleteTask>) -> Result<()> {
        let task = &mut ctx.accounts.task_escrow;
        task.is_completed = true;
        Ok(())
    }

    // ✅ Minimal RPC for frontend MVP (no args)
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

// Account structure for tasks
#[account]
pub struct TaskEscrow {
    pub depositor: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub is_completed: bool,
}

// Accounts for create_task RPC
#[derive(Accounts)]
pub struct CreateTask<'info> {
    #[account(init, payer = depositor, space = 8 + 32 + 32 + 8 + 1)]
    pub task_escrow: Account<'info, TaskEscrow>,
    #[account(mut)]
    pub depositor: Signer<'info>,
    pub recipient: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

// Accounts for complete_task RPC
#[derive(Accounts)]
pub struct CompleteTask<'info> {
    #[account(mut)]
    pub task_escrow: Account<'info, TaskEscrow>,
}

// Accounts for initialize RPC
#[derive(Accounts)]
pub struct Initialize {}
